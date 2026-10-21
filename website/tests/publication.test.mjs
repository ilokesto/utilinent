import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash } from '../../scripts/docs-publication.mjs';
import { resolveInstalledPackage } from '../../scripts/docs-runtime.mjs';
import { scopeDevelopmentLink, getDocsChannel, publishedPackages } from '../lib/publication.ts';
import { publicPackageNames, rewriteDocsLink, rewriteMarkdownLinks } from '../lib/docs-links.ts';

test('released Utilinent: pinned npm package -> exact exports and payload bytes', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const release = publishedPackages.utilinent;
  const installed = await resolveInstalledPackage('@ilokesto/released-utilinent', path.join(root, 'docs-publication/runtime'));
  assert.equal(installed.manifest.version, release.version);
  assert.deepEqual(Object.keys(installed.manifest.exports).sort(), ['.', './hooks']);
  assert.ok(installed.directory.startsWith(path.join(root, 'node_modules')));
  const receipt = JSON.parse(await readFile(path.join(root, release.snapshot, 'receipt.json'), 'utf8'));
  for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/hooks/index.js', 'dist/hooks/index.d.ts']) {
    const expected = receipt.registry.files.find(item => item.path === file);
    assert.ok(expected, `missing packed export file ${file}`);
    const bytes = await readFile(path.join(installed.directory, file));
    assert.equal(bytes.length, expected.bytes, `packed export file size ${file}`);
    assert.equal(hash(bytes), expected.sha256, `packed export file hash ${file}`);
  }
});

test('development links: complete public classification -> locale and channel preserved', () => {
  assert.equal(publicPackageNames.length, 8);
  for (const name of publicPackageNames) {
    const host = name === 'utilinent' ? '' : 'https://ilokesto.ayden94.com';
    assert.equal(scopeDevelopmentLink(`/en/${name}/quick-start#install`), `${host}/en/${name}/next/quick-start#install`);
    assert.equal(scopeDevelopmentLink(`/ko/${name}?x=1`), `${host}/ko/${name}/next?x=1`);
    assert.equal(scopeDevelopmentLink(`/en/${name}/next/quick-start`), `${host}/en/${name}/next/quick-start`);
    assert.equal(rewriteDocsLink(`/ko/${name}/next/core-concepts`, false, 'utilinent'), `${host}/ko/${name}/next/core-concepts`);
  }
  assert.equal(getDocsChannel(['utilinent']), 'released');
  assert.equal(getDocsChannel(['utilinent', 'next']), 'next');
  assert.equal(getDocsChannel(['modal', 'next']), undefined);
  assert.equal(scopeDevelopmentLink('https://example.com/en/store'), 'https://example.com/en/store');
  assert.equal(scopeDevelopmentLink('../reference/store'), '../reference/store');
  assert.equal(scopeDevelopmentLink('/en/queryable'), '/en/queryable');
  assert.equal(scopeDevelopmentLink('/en/unknown'), '/en/unknown');
});

test('Markdown links: prose versus code -> only real link destinations change', () => {
  const code = '```ts\nconst link = "[Overlay](/ko/overlay)";\n```\n';
  const inline = '`[Overlay](/ko/overlay)` and ``const x = `[/en/overlay](/en/overlay)`;``\n';
  const markdown = '[Overlay](/ko/overlay#provider) [Self](/en/modal/core-concepts)\n'
    + '[overlay]: /en/overlay/next/core-concepts\n' + code + inline;

  const output = rewriteMarkdownLinks(markdown, true, 'modal');

  assert.ok(output.includes('[Overlay](https://ilokesto.ayden94.com/ko/overlay/next#provider)'));
  assert.ok(output.includes('[Self](/en/modal/next/core-concepts)'));
  assert.ok(output.includes('[overlay]: https://ilokesto.ayden94.com/en/overlay/next/core-concepts'));
  assert.ok(output.endsWith(code + inline));
  const multiline = '`example\n[Overlay](/ko/overlay)\n`';
  assert.equal(rewriteMarkdownLinks(multiline, true, 'modal'), multiline);
  const fenced = '```md\n```typescript\n[Overlay](/ko/overlay)\n```\n';
  assert.equal(rewriteMarkdownLinks(fenced, true, 'modal'), fenced);
});

test('source links: current versus archived revision -> owning successor paths', () => {
  const old = 'https://github.com/ilokesto/ilokesto';
  assert.equal(rewriteDocsLink(`${old}/tree/main/packages/utilinent/src`, true, 'utilinent'),
    'https://github.com/ilokesto/utilinent/tree/main/src');
  const sha = 'e'.repeat(40);
  assert.equal(rewriteDocsLink(`${old}/blob/${sha}/packages/utilinent/src/core.ts`, false, 'utilinent'),
    `https://github.com/ilokesto/utilinent/blob/${sha}/packages/utilinent/src/core.ts`);
});
