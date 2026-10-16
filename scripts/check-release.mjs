import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const [tag, ...args] = process.argv.slice(2);
const assetsIndex = args.indexOf('--assets');
const assetsDirectory = assetsIndex >= 0 ? args[assetsIndex + 1] : undefined;

if (args.some((arg, index) => arg === '--assets' && !args[index + 1])) {
  throw new Error('Informe a pasta de instaladores após --assets.');
}

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
  throw new Error(`Versão inválida em package.json: ${packageJson.version}`);
}

if (packageLock.version !== packageJson.version || packageLock.packages?.['']?.version !== packageJson.version) {
  throw new Error(`Sincronize as versões ${packageJson.version} em package.json e package-lock.json.`);
}

if (tag && tag !== `v${packageJson.version}`) {
  throw new Error(`A tag ${tag} deve corresponder à versão do pacote: v${packageJson.version}.`);
}

if (assetsDirectory) {
  const resolvedAssetsDirectory = path.resolve(root, assetsDirectory);
  const assetNames = await readdir(resolvedAssetsDirectory);
  const has = pattern => assetNames.some(name => pattern.test(name));
  const requiredAssets = [
    [/^latest\.yml$/i, 'manifesto de atualização do Windows (latest.yml)'],
    [/^latest-mac\.yml$/i, 'manifesto de atualização do macOS (latest-mac.yml)'],
    [/^latest-linux\.yml$/i, 'manifesto de atualização do Linux (latest-linux.yml)'],
    [/\.exe$/i, 'instalador Windows (.exe)'],
    [/\.dmg$/i, 'instalador macOS (.dmg)'],
    [/\.zip$/i, 'pacote de atualização macOS (.zip)'],
    [/\.appimage$/i, 'instalador Linux (.AppImage)'],
  ];
  const missingAssets = requiredAssets.filter(([pattern]) => !has(pattern)).map(([, label]) => label);
  if (missingAssets.length) {
    throw new Error(`Artefatos de release ausentes: ${missingAssets.join(', ')}.`);
  }
  for (const manifestName of ['latest.yml', 'latest-mac.yml', 'latest-linux.yml']) {
    const manifest = (await readFile(path.join(resolvedAssetsDirectory, manifestName), 'utf8')).replace(/^\uFEFF/, '');
    const assetPath = manifest.match(/^path:\s*(.+)$/m)?.[1].trim();
    if (!assetPath || !assetNames.includes(assetPath)) {
      throw new Error(`${manifestName} aponta para um instalador ausente: ${assetPath || '(caminho não informado)'}.`);
    }
  }
}

console.log(`Release ${tag || `v${packageJson.version}`} validada.`);
