import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
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
  git(repository, ['clone', '--local', '--no-hardlinks', '--quiet', repository, root]);
  git(root, ['fetch', '--no-tags', repository,
    '+refs/remotes/origin/legacy/*:refs/remotes/origin/legacy/*',
    '+refs/tags/*:refs/tags/*']);
  await verifyHistory(root, manifest);
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
  git(repository, ['clone', '--local', '--no-hardlinks', '--quiet', repository, root]);
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

const currentPackages = await Promise.all([
  'package.json', 'website/package.json', 'docs-publication/runtime/package.json',
].map(async file => [file, JSON.parse(await readFile(path.join(repository, file), 'utf8'))]));

async function scannerFixture(t, workspaces = false) {
  await mkdir(path.join(repository, '.qa-run'), { recursive: true });
  const parent = await mkdtemp(path.join(repository, '.qa-run/utilinent-scanner-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'repo');
  const outside = path.join(parent, 'outside');
  await mkdir(root);
  await mkdir(outside);
  await git(root, ['init', '--quiet']);
  for (const [file, value] of workspaces ? currentPackages : currentPackages.slice(0, 1)) {
    await put(root, file, value);
  }
  return { root, outside };
}

function scannerVerify(t, root) {
  const args = [path.join(repository, 'scripts/verify-migration.mjs'), 'standalone', '--repo', root, '--manifest-stdin', '-'];
  const result = spawnSync(process.execPath, args, {
    cwd: root, input: JSON.stringify(manifest), encoding: 'utf8', timeout: 10_000, maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  const output = JSON.parse(result.status === 0 ? result.stdout : result.stderr);
  t.diagnostic(JSON.stringify({ command: [process.execPath, ...args], exitCode: result.status, stdout: result.stdout, stderr: result.stderr }));
  return { exitCode: result.status, ...output };
}

function scannerRejects(t, root, code) {
  const result = scannerVerify(t, root);
  assert.equal(result.exitCode, 1);
  assert.equal(result.code, code);
}

for (const staged of [false, true]) {
  test(`standalone discovery: ${staged ? 'staged' : 'untracked'} current private workspaces -> all three manifests accepted`, async t => {
    const { root } = await scannerFixture(t, true);
    if (staged) await git(root, ['add', '.']);

    const result = scannerVerify(t, root);

    assert.equal(result.exitCode, 0);
    assert.equal(result.results[0].manifests, 3);
  });
}

test('standalone discovery: untracked sibling workspace -> rejected after root is staged', async t => {
  const { root } = await scannerFixture(t);
  await git(root, ['add', 'package.json']);
  await put(root, 'examples/new-example/package.json', {
    name: '@ilokesto/utilinent-example', private: true, dependencies: { '@ilokesto/store': 'workspace:*' },
  });

  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
});

test('standalone discovery: frozen and generated manifests -> excluded without hiding docs runtime', async t => {
  const { root } = await scannerFixture(t, true);
  for (const file of [
    'docs-publication/releases/utilinent/1.3.0/r1/package.json',
    '.migration/fixture/package.json',
    'website/.next/package.json',
    'website/.source/package.json',
    'docs-publication/runtime/.generated/package.json',
    'node_modules/unrelated/package.json',
    'dist/package.json',
  ]) {
    await put(root, file, { dependencies: { '@ilokesto/store': 'workspace:*' } });
  }
  await git(root, ['add', '.']);

  const result = scannerVerify(t, root);
  assert.equal(result.exitCode, 0);
  assert.equal(result.results[0].manifests, 3);
  await put(root, 'docs-publication/runtime/package.json', {
    name: '@ilokesto/utilinent-docs-runtime', private: true, dependencies: { '@ilokesto/store': 'workspace:*' },
  });
  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
});

for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
  test(`standalone dependency: sibling workspace in ${section} -> rejected`, async t => {
    const { root } = await scannerFixture(t);
    await put(root, 'website/package.json', {
      name: '@ilokesto/utilinent-website', private: true, [section]: { '@ilokesto/store': 'workspace:*' },
    });
    await git(root, ['add', '.']);

    scannerRejects(t, root, 'SIBLING_DEPENDENCY');
  });
}

test('standalone workspace: root, public consumer, missing target and disguised sibling -> rejected', async t => {
  const { root } = await scannerFixture(t, true);
  await git(root, ['add', '.']);
  await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies: { '@ilokesto/utilinent': 'workspace:*' } });
  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
  await put(root, 'package.json', currentPackages[0][1]);
  await put(root, 'website/package.json', {
    name: '@ilokesto/utilinent-website', dependencies: { '@ilokesto/utilinent': 'workspace:*' },
  });
  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
  await put(root, 'website/package.json', {
    name: '@ilokesto/utilinent-website', private: true, dependencies: { '@ilokesto/missing-runtime': 'workspace:*' },
  });
  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
  await put(root, 'website/package.json', {
    name: '@ilokesto/utilinent-website', private: true, dependencies: { '@ilokesto/store': 'workspace:*' },
  });
  await put(root, 'local-store/package.json', { name: '@ilokesto/store', private: true });
  scannerRejects(t, root, 'SIBLING_DEPENDENCY');
});

test('standalone workspace: duplicate private package name -> rejected', async t => {
  const { root } = await scannerFixture(t, true);
  await put(root, 'duplicate/package.json', { name: '@ilokesto/utilinent-docs-runtime', private: true });

  scannerRejects(t, root, 'DUPLICATE_WORKSPACE_NAME');
});

test('standalone workspace: own name redirects to a sibling path or alias -> rejected', async t => {
  const { root } = await scannerFixture(t, true);
  for (const range of ['workspace:../../store', 'workspace:%2e%2e/%2e%2e/store', 'workspace:@ilokesto/store@*']) {
    await put(root, 'website/package.json', {
      name: '@ilokesto/utilinent-website', private: true, dependencies: { '@ilokesto/utilinent': range },
    });

    scannerRejects(t, root, 'SIBLING_DEPENDENCY');
  }
});

for (const [name, range] of [
  ['runtime', 'workspace:@ilokesto/utilinent-docs-runtime@*'],
  ['own-utilinent', 'workspace:@ilokesto/utilinent@^1.3.0'],
  ['runtime', 'workspace:../docs-publication/runtime'],
  ['own-utilinent', 'workspace:..'],
]) {
  test(`supported reference: ${range} -> own root or private workspace accepted`, async t => {
    const { root } = await scannerFixture(t, true);
    await put(root, 'website/package.json', {
      name: '@ilokesto/utilinent-website', private: true, dependencies: { [name]: range },
    });

    assert.equal(scannerVerify(t, root).exitCode, 0);
  });
}

for (const protocol of ['file', 'link']) {
  for (const spelling of ['../outside', './nested/../../outside', '.\\nested\\..\\..\\outside']) {
    test(`standalone path: ${protocol}:${spelling} -> normalized escape rejected`, async t => {
      const { root } = await scannerFixture(t);
      await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies: { external: `${protocol}:${spelling}` } });
      await git(root, ['add', '.']);

      scannerRejects(t, root, 'EXTERNAL_DEPENDENCY_PATH');
    });
  }

  test(`standalone path: absolute ${protocol} dependency -> rejected`, async t => {
    const { root, outside } = await scannerFixture(t);
    await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies: { external: `${protocol}:${outside}` } });

    scannerRejects(t, root, 'EXTERNAL_DEPENDENCY_PATH');
  });

  test(`standalone path: ${protocol} target follows ignored symlink outside repo -> rejected`, async t => {
    const { root, outside } = await scannerFixture(t);
    await writeFile(path.join(root, '.gitignore'), 'bridge\n');
    await symlink(outside, path.join(root, 'bridge'), 'dir');
    await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies: { external: `${protocol}:./bridge` } });

    scannerRejects(t, root, 'EXTERNAL_DEPENDENCY_PATH');
  });

  test(`supported reference: ${protocol} literal percent directory -> accepted without URI decoding`, async t => {
    const { root } = await scannerFixture(t);
    await put(root, '%2e%2e/payload/package.json', { name: 'utilinent-local-data', private: true });
    await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies: { 'utilinent-local-data': `${protocol}:%2e%2e/payload` } });

    assert.equal(scannerVerify(t, root).exitCode, 0);
  });

  test(`supported reference: ${protocol} protocol slashes -> normalized private runtime accepted`, async t => {
    const { root } = await scannerFixture(t, true);
    await put(root, 'website/package.json', {
      name: '@ilokesto/utilinent-website', private: true,
      dependencies: { '@ilokesto/utilinent-docs-runtime': `${protocol}://../docs-publication/runtime` },
    });

    assert.equal(scannerVerify(t, root).exitCode, 0);
  });
}

test('standalone path: internal relative local dependency -> accepted without relaxing external checks', async t => {
  const { root } = await scannerFixture(t, true);
  await put(root, 'website/package.json', {
    name: '@ilokesto/utilinent-website', private: true,
    dependencies: { '@ilokesto/utilinent-docs-runtime': 'link:../docs-publication/runtime' },
  });

  assert.equal(scannerVerify(t, root).exitCode, 0);
});

test('supported reference: isolated pnpm workspace resolves the same local forms -> scanner accepts them', async t => {
  const { root } = await scannerFixture(t);
  await put(root, 'package.json', { name: '@ilokesto/utilinent', version: '1.3.0', private: true });
  await put(root, 'website/package.json', {
    name: '@ilokesto/utilinent-website', private: true,
    dependencies: {
      'own-utilinent': 'workspace:@ilokesto/utilinent@*',
      runtime: 'workspace:@ilokesto/utilinent-docs-runtime@*',
      'relative-runtime': 'workspace:../docs-publication/runtime',
      'linked-runtime': 'link://../docs-publication/runtime',
      'local-data': 'file:../%2e%2e/payload',
    },
  });
  await put(root, 'docs-publication/runtime/package.json', {
    name: '@ilokesto/utilinent-docs-runtime', version: '0.0.0', private: true,
  });
  await put(root, '%2e%2e/payload/package.json', { name: 'utilinent-local-data', version: '1.0.0', private: true });
  await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - .\n  - website\n  - docs-publication/runtime\n');

  const result = spawnSync('pnpm', ['install', '--lockfile-only', '--offline', '--ignore-scripts'], {
    cwd: root, encoding: 'utf8', timeout: 30_000,
  });

  t.diagnostic(JSON.stringify({ command: ['pnpm', 'install', '--lockfile-only', '--offline', '--ignore-scripts'], cwd: root, exitCode: result.status, stdout: result.stdout, stderr: result.stderr }));
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  const verification = scannerVerify(t, root);
  assert.equal(verification.exitCode, 0);
  assert.equal(verification.results[0].manifests, 4);
});

test('standalone path: repository manifest symlink escapes -> rejected', async t => {
  const { root, outside } = await scannerFixture(t);
  await put(outside, 'package.json', { name: '@ilokesto/utilinent-website', private: true });
  await mkdir(path.join(root, 'website'));
  await symlink(path.join(outside, 'package.json'), path.join(root, 'website/package.json'));

  scannerRejects(t, root, 'EXTERNAL_REPOSITORY_PATH');
});

test('standalone path: untracked directory symlink escapes -> rejected', async t => {
  const { root, outside } = await scannerFixture(t);
  await put(outside, 'package.json', { name: '@ilokesto/utilinent-website', private: true });
  await symlink(outside, path.join(root, 'website'), 'dir');

  scannerRejects(t, root, 'EXTERNAL_REPOSITORY_PATH');
});

test('standalone safety: private Queryable dependency and registry alias -> rejected', async t => {
  const { root } = await scannerFixture(t);
  for (const dependencies of [
    { '@ilokesto/queryable': '0.0.1' },
    { query: 'npm:@ilokesto/queryable@0.0.1' },
  ]) {
    await put(root, 'package.json', { name: '@ilokesto/utilinent', dependencies });
    scannerRejects(t, root, 'PRIVATE_PACKAGE_DEPENDENCY');
  }
});

test('standalone scripts: legacy sibling build and sibling filter -> still rejected', async t => {
  const { root } = await scannerFixture(t);
  for (const pretest of ['pnpm --dir ../store build', 'pnpm --filter @ilokesto/store run build']) {
    await put(root, 'package.json', { name: '@ilokesto/utilinent', scripts: { pretest } });
    scannerRejects(t, root, 'SIBLING_SCRIPT');
  }
});
