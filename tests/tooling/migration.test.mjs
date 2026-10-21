import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { readObjects, verifyCheckpoint, verifyDeletionGate, verifyHistory, verifyStandalone } from '../../scripts/verify-migration.mjs';

const repository = path.resolve(import.meta.dirname, '../..');
const manifest = JSON.parse(await readFile(path.join(repository, '.migration/source-manifest.json'), 'utf8'));
const git = (root, args) => execFileSync('git', ['--no-pager', '-C', root, ...args], {
  env: { ...process.env, GIT_MASTER: '1', GIT_PAGER: 'cat', PAGER: 'cat',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.test',
    GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.test' },
  stdio: 'pipe',
});
const put = async (root, file, value) => {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), JSON.stringify(value));
};

test('standalone workspace: own library and private runtime -> permitted without sibling links', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'utilinent-workspace-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, ['init', '--quiet']);
  await put(root, 'package.json', { name: '@ilokesto/utilinent', version: '9.0.0' });
  await put(root, 'website/package.json', { name: '@ilokesto/utilinent-website', private: true, dependencies: {
    '@ilokesto/utilinent': 'workspace:*', '@ilokesto/utilinent-docs-runtime': 'workspace:*',
  } });
  await put(root, 'docs-publication/runtime/package.json', { name: '@ilokesto/utilinent-docs-runtime', private: true,
    dependencies: { '@ilokesto/released-utilinent': 'npm:@ilokesto/utilinent@1.2.0' } });
  git(root, ['add', '.']);

  assert.equal((await verifyStandalone(root, manifest)).manifests, 3);

  await put(root, 'website/package.json', { name: '@ilokesto/utilinent-website', private: true,
    dependencies: { '@ilokesto/store': 'workspace:*' } });
  await assert.rejects(verifyStandalone(root, manifest), /SIBLING_DEPENDENCY/);
  await put(root, 'website/package.json', { name: '@ilokesto/utilinent-website', private: true,
    dependencies: { '@ilokesto/store': 'file:../../store' } });
  await assert.rejects(verifyStandalone(root, manifest), /EXTERNAL_DEPENDENCY_PATH/);
  await put(root, 'website/package.json', { name: '@ilokesto/utilinent-website', private: false,
    dependencies: { '@ilokesto/utilinent': 'workspace:*' } });
  await assert.rejects(verifyStandalone(root, manifest), /SIBLING_DEPENDENCY/);
  await put(root, 'website/package.json', { name: '@ilokesto/utilinent-website', private: true,
    dependencies: { '@ilokesto/queryable': '0.0.1' } });
  await assert.rejects(verifyStandalone(root, manifest), /PRIVATE_PACKAGE_DEPENDENCY/);
});

test('archive history: missing mapped branch -> rejected before accepting object counts', async t => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'utilinent-missing-archive-ref-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'clone');
  git(repository, ['clone', '--no-local', '--quiet', repository, root]);
  const main = manifest.archives.find(source => source.id === 'ilokesto')
    .refs.find(ref => ref.ref === 'refs/heads/main');
  const alternate = main.destination.replace('refs/heads/', 'refs/remotes/origin/');
  const refs = git(root, ['for-each-ref', '--format=%(refname)']).toString().trim().split('\n');
  const present = [main.destination, alternate].filter(ref => refs.includes(ref));
  assert.ok(present.length > 0, 'fixture clone must contain a mapped main ref');
  for (const ref of present) git(root, ['update-ref', '-d', ref]);

  await assert.rejects(verifyHistory(root, manifest), error => error.code === 'MISSING_ARCHIVE_REF');
});

test('archive tag target: missing commit object -> rejected and reported missing', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'utilinent-missing-tag-target-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'packages/utilinent'), { recursive: true });
  await writeFile(path.join(root, 'packages/utilinent/README.md'), 'fixture\n');
  git(root, ['init', '--quiet', '-b', 'main']);
  git(root, ['add', 'packages/utilinent/README.md']);
  git(root, ['commit', '--quiet', '-m', 'Missing tag target fixture']);
  const commit = git(root, ['rev-parse', 'HEAD']).toString().trim();
  const tree = git(root, ['rev-parse', 'HEAD:packages/utilinent']).toString().trim();
  const tag = 'refs/tags/@ilokesto/utilinent@1.0.0';
  git(root, ['tag', '-a', tag.slice('refs/tags/'.length), commit, '-m', 'fixture release']);
  const tagObject = git(root, ['rev-parse', tag]).toString().trim();
  git(root, ['update-ref', 'refs/heads/legacy/ilokesto/heads/main', commit]);
  const broken = {
    schemaVersion: 1,
    package: 'utilinent',
    source: { cut: commit, prefix: 'packages/utilinent', tree },
    projection: { commit, correspondence: [{ source: commit, projected: commit, tree }] },
    checkpoint: { commit },
    archives: [{
      id: 'ilokesto',
      refs: [
        { ref: tag, oid: tagObject, type: 'tag', peeled: commit, peeledType: 'commit', destination: tag },
        { ref: 'refs/heads/main', oid: commit, type: 'commit', peeled: null, peeledType: null, destination: 'refs/heads/legacy/ilokesto/heads/main' },
      ],
      objects: [{ oid: commit, type: 'commit', size: 1, sha256: 'a'.repeat(64) }],
      symbolicRefs: [],
    }],
    imports: [],
    provenance: { lookups: [], receipts: [] },
  };
  const objectPath = path.join(root, '.git/objects', commit.slice(0, 2), commit.slice(2));
  await rm(objectPath);

  await assert.rejects(verifyHistory(root, broken), error =>
    error.code === 'ARCHIVE_TAG_OR_TYPE_CHANGED' || error.code === 'GIT_FAILED');
  await assert.rejects(readObjects(root, [commit]), error => error.code === 'MISSING_OBJECT');
});

test('deletion gate: unexpected target -> rejects before source or proof reads', async () => {
  const input = {
    schemaVersion: 1,
    stage: 'remote',
    remoteReleaseReady: true,
    targets: ['ilokesto/caro-kann', 'ilokesto/sicilian', 'ilokesto/grunfeld', 'ilokesto/unexpected'],
  };
  await assert.rejects(verifyDeletionGate(input, process.cwd()), error =>
    error.code === 'UNEXPECTED_DELETION_TARGET');
});

test('checkpoint: future development commit and new version -> immutable history remains valid', async t => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'utilinent-future-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'clone');
  git(repository, ['clone', '--no-local', '--quiet', repository, root]);
  const current = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  current.version = '9.0.0';
  await put(root, 'package.json', current);
  await writeFile(path.join(root, 'future-development.txt'), 'future development\n');
  git(root, ['add', 'package.json', 'future-development.txt']);
  git(root, ['commit', '--quiet', '-m', 'Future development fixture']);

  const result = await verifyCheckpoint(root, manifest);

  assert.equal(result.checkpoint, manifest.checkpoint.commit);
  assert.notEqual(git(root, ['rev-parse', 'HEAD']).toString().trim(), manifest.checkpoint.commit);
  await verifyStandalone(root, manifest);
});
