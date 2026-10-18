/**
 * Tezz Auth SDK - Version Manager & Release Suggestion Engine
 *
 * Inspects released versions across:
 * 1. GitHub Releases API
 * 2. Git tags
 * 3. Public NPM Registry (@tezzcorp/auth-sdk)
 *
 * Computes semantic versioning suggestions (patch, minor, major) and synchronizes
 * version numbers across all SDK manifests (NPM, Python, .NET, Java, Android).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SDK_ROOT = path.resolve(__dirname, '..');
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'TezzCorp-Pvt-Ltd/TezzAuthSdk';
const NPM_PACKAGE = '@tezzcorp/auth-sdk';

// Manifest file paths
const MANIFESTS = {
  npm: path.join(SDK_ROOT, 'npm', 'package.json'),
  python: path.join(SDK_ROOT, 'python', 'pyproject.toml'),
  dotnet: path.join(SDK_ROOT, 'dotnet', 'Tezz.Auth', 'Tezz.Auth.csproj'),
  javaStandard: path.join(SDK_ROOT, 'java', 'standard', 'pom.xml'),
  android: path.join(SDK_ROOT, 'java', 'android', 'build.gradle')
};

/**
 * Parse semver string "1.2.3" into { raw, tag, major, minor, patch }
 */
function parseSemver(verStr) {
  if (!verStr || typeof verStr !== 'string') return null;
  const clean = verStr.trim().replace(/^v/i, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    raw: clean,
    tag: `v${clean}`,
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Compare two semver strings: returns >0 if a > b, <0 if a < b, 0 if equal
 */
function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

/**
 * Query git tags in the repository to find all release tags
 */
function getGitReleaseTags() {
  try {
    const raw = execSync('git tag -l "v*"', { cwd: SDK_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return raw
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0 && parseSemver(t));
  } catch (err) {
    return [];
  }
}

/**
 * Query GitHub Releases API for the latest release tag
 */
async function fetchLatestGitHubRelease() {
  try {
    const headers = { 'User-Agent': 'TezzAuth-Version-Manager' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tag_name ? parseSemver(data.tag_name) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Query NPM Registry for published versions of @tezzcorp/auth-sdk
 */
async function fetchNpmVersions() {
  try {
    const res = await fetch(`https://registry.npmjs.org/${NPM_PACKAGE}`);
    if (!res.ok) return [];
    const data = await res.json();
    const versions = Object.keys(data.versions || {});
    return versions.map(v => parseSemver(v)).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * Read current version declared in local SDK manifests
 */
function getLocalVersions() {
  const results = {};

  // NPM
  if (fs.existsSync(MANIFESTS.npm)) {
    try {
      const data = JSON.parse(fs.readFileSync(MANIFESTS.npm, 'utf8'));
      results.npm = data.version;
    } catch (e) {
      results.npm = null;
    }
  }

  // Python
  if (fs.existsSync(MANIFESTS.python)) {
    try {
      const text = fs.readFileSync(MANIFESTS.python, 'utf8');
      const match = text.match(/version\s*=\s*"([^"]+)"/);
      results.python = match ? match[1] : null;
    } catch (e) {
      results.python = null;
    }
  }

  // .NET
  if (fs.existsSync(MANIFESTS.dotnet)) {
    try {
      const text = fs.readFileSync(MANIFESTS.dotnet, 'utf8');
      const match = text.match(/<Version>([^<]+)<\/Version>/);
      results.dotnet = match ? match[1] : null;
    } catch (e) {
      results.dotnet = null;
    }
  }

  // Java Standard
  if (fs.existsSync(MANIFESTS.javaStandard)) {
    try {
      const text = fs.readFileSync(MANIFESTS.javaStandard, 'utf8');
      const match = text.match(/<artifactId>auth-sdk<\/artifactId>\s*<version>([^<]+)<\/version>/);
      results.javaStandard = match ? match[1] : null;
    } catch (e) {
      results.javaStandard = null;
    }
  }

  // Android
  if (fs.existsSync(MANIFESTS.android)) {
    try {
      const text = fs.readFileSync(MANIFESTS.android, 'utf8');
      const match = text.match(/versionName\s+"([^"]+)"/);
      results.android = match ? match[1] : null;
    } catch (e) {
      results.android = null;
    }
  }

  return results;
}

/**
 * Compute semantic version suggestions
 */
function computeSuggestions(baseVer) {
  const v = parseSemver(baseVer) || { major: 1, minor: 0, patch: 0 };
  return {
    current: v.raw,
    currentTag: `v${v.raw}`,
    patch: `${v.major}.${v.minor}.${v.patch + 1}`,
    patchTag: `v${v.major}.${v.minor}.${v.patch + 1}`,
    minor: `${v.major}.${v.minor + 1}.0`,
    minorTag: `v${v.major}.${v.minor + 1}.0`,
    major: `${v.major + 1}.0.0`,
    majorTag: `v${v.major + 1}.0.0`
  };
}

/**
 * Synchronize all SDK manifest files to a specified version
 */
function bumpAllManifests(targetVersion) {
  const parsed = parseSemver(targetVersion);
  if (!parsed) {
    throw new Error(`Invalid target semver version: ${targetVersion}`);
  }
  const ver = parsed.raw;
  const updated = [];

  // 1. NPM
  if (fs.existsSync(MANIFESTS.npm)) {
    const pkg = JSON.parse(fs.readFileSync(MANIFESTS.npm, 'utf8'));
    pkg.version = ver;
    fs.writeFileSync(MANIFESTS.npm, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    updated.push(`NPM package.json -> ${ver}`);
  }

  // 2. Python
  if (fs.existsSync(MANIFESTS.python)) {
    let py = fs.readFileSync(MANIFESTS.python, 'utf8');
    py = py.replace(/version\s*=\s*"[^"]+"/, `version = "${ver}"`);
    fs.writeFileSync(MANIFESTS.python, py, 'utf8');
    updated.push(`Python pyproject.toml -> ${ver}`);
  }

  // 3. .NET
  if (fs.existsSync(MANIFESTS.dotnet)) {
    let cs = fs.readFileSync(MANIFESTS.dotnet, 'utf8');
    cs = cs.replace(/<Version>[^<]+<\/Version>/, `<Version>${ver}</Version>`);
    fs.writeFileSync(MANIFESTS.dotnet, cs, 'utf8');
    updated.push(`.NET Tezz.Auth.csproj -> ${ver}`);
  }

  // 4. Java Standard
  if (fs.existsSync(MANIFESTS.javaStandard)) {
    let pom = fs.readFileSync(MANIFESTS.javaStandard, 'utf8');
    pom = pom.replace(
      /(<artifactId>auth-sdk<\/artifactId>\s*<version>)[^<]+(<\/version>)/,
      `$1${ver}$2`
    );
    fs.writeFileSync(MANIFESTS.javaStandard, pom, 'utf8');
    updated.push(`Java pom.xml -> ${ver}`);
  }

  // 5. Android
  if (fs.existsSync(MANIFESTS.android)) {
    let gradle = fs.readFileSync(MANIFESTS.android, 'utf8');
    gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${ver}"`);
    gradle = gradle.replace(/version\s*=\s*'[^']+'/, `version = '${ver}'`);
    fs.writeFileSync(MANIFESTS.android, gradle, 'utf8');
    updated.push(`Android build.gradle -> ${ver}`);
  }

  return updated;
}

/**
 * Generate GitHub Actions Step Summary markdown
 */
function generateMarkdownSummary(releasedVer, allKnownReleased, localVers, suggestions, conflictFound) {
  let md = '';
  md += '## Tezz Auth SDK Release Version Analysis\n\n';

  if (releasedVer) {
    md += `**Current Released Version**: \`${releasedVer.tag}\`\n\n`;
  } else {
    md += '**Current Released Version**: None found (initial release pending)\n\n';
  }

  md += '### Release Version Suggestions\n\n';
  md += '| Release Type | Suggested Version | Recommended Use Case |\n';
  md += '| :--- | :--- | :--- |\n';
  md += `| **Minor (Recommended)** | \`${suggestions.minorTag}\` | New features (e.g. Profile API, cancelDeletion, account switching) |\n`;
  md += `| **Patch** | \`${suggestions.patchTag}\` | Backward-compatible bug fixes and documentation updates |\n`;
  md += `| **Major** | \`${suggestions.majorTag}\` | Breaking changes or major architectural redesigns |\n\n`;

  md += '### Current Manifest Versions in Repository\n\n';
  md += '| Platform | Manifest Path | Declared Version |\n';
  md += '| :--- | :--- | :--- |\n';
  md += `| JavaScript / NPM | \`npm/package.json\` | \`${localVers.npm || 'n/a'}\` |\n`;
  md += `| Python | \`python/pyproject.toml\` | \`${localVers.python || 'n/a'}\` |\n`;
  md += `| .NET (C#) | \`dotnet/Tezz.Auth/Tezz.Auth.csproj\` | \`${localVers.dotnet || 'n/a'}\` |\n`;
  md += `| Java Standard | \`java/standard/pom.xml\` | \`${localVers.javaStandard || 'n/a'}\` |\n`;
  md += `| Android AAR | \`java/android/build.gradle\` | \`${localVers.android || 'n/a'}\` |\n\n`;

  if (allKnownReleased.length > 0) {
    md += `**All Known Released Tags/Versions**: ${allKnownReleased.map(v => `\`${v}\``).join(', ')}\n\n`;
  }

  if (conflictFound) {
    md += '> [!WARNING]\n';
    md += `> **Version Conflict Detected**: The local version \`${releasedVer.tag}\` has already been published to registries!\n`;
    md += `> Attempting to re-publish \`${releasedVer.tag}\` will cause a 409 Conflict.\n`;
    md += `> **Action Required**: Select \`release_minor\` (\`${suggestions.minorTag}\`) or \`release_patch\` (\`${suggestions.patchTag}\`).\n\n`;
  }

  return md;
}

/**
 * Main execution handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  // 1. Gather all released versions across Git tags, GitHub Releases, and NPM
  const gitTags = getGitReleaseTags();
  const ghRelease = await fetchLatestGitHubRelease();
  const npmVersions = await fetchNpmVersions();

  const releasedSet = new Set();
  gitTags.forEach(t => releasedSet.add(parseSemver(t).raw));
  if (ghRelease) releasedSet.add(ghRelease.raw);
  npmVersions.forEach(v => releasedSet.add(v.raw));

  const sortedReleased = Array.from(releasedSet).sort(compareSemver);
  const highestReleasedRaw = sortedReleased.length > 0 ? sortedReleased[sortedReleased.length - 1] : '1.0.0';
  const releasedVer = parseSemver(highestReleasedRaw);

  const suggestions = computeSuggestions(highestReleasedRaw);
  const localVers = getLocalVersions();

  // Check if any local manifest is currently on an already-released version
  const conflictFound = releasedSet.has(localVers.npm) || releasedSet.has(localVers.python);

  if (command === 'check' || command === 'suggest') {
    console.log('======================================================');
    console.log('Tezz Auth SDK - Version & Release Analysis');
    console.log('======================================================\n');

    console.log(`Current Released Version : ${releasedVer ? releasedVer.tag : 'None (initial)'}`);
    console.log(`All Known Released Tags  : ${sortedReleased.length > 0 ? sortedReleased.map(s => 'v' + s).join(', ') : 'none'}\n`);

    console.log('Version Suggestions for Next Release:');
    console.log(`  - Minor (Recommended) : ${suggestions.minorTag} (use for new features, profile, multi-account)`);
    console.log(`  - Patch                : ${suggestions.patchTag} (use for bug fixes only)`);
    console.log(`  - Major                : ${suggestions.majorTag} (use for breaking API changes)\n`);

    console.log('Current Local Manifest Versions:');
    console.log(`  - NPM                  : ${localVers.npm}`);
    console.log(`  - Python               : ${localVers.python}`);
    console.log(`  - .NET                 : ${localVers.dotnet}`);
    console.log(`  - Java Standard        : ${localVers.javaStandard}`);
    console.log(`  - Android              : ${localVers.android}\n`);

    if (conflictFound) {
      console.log('WARNING: Local manifest version matches an already-released tag (' + releasedVer.tag + ')!');
      console.log('Re-publishing with this version will fail with HTTP 409 Conflict.');
      console.log('Recommended next action: Run bump to ' + suggestions.minor + '\n');
    }

    // Write GitHub Step Summary if running inside GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) {
      const summaryMd = generateMarkdownSummary(
        releasedVer,
        sortedReleased.map(s => 'v' + s),
        localVers,
        suggestions,
        conflictFound
      );
      try {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, 'utf8');
      } catch (err) {
        // Ignore file write errors
      }
    }

    // Write outputs for GitHub Actions if GITHUB_OUTPUT exists
    if (process.env.GITHUB_OUTPUT) {
      const outputs = [
        `current_released_version=${releasedVer ? releasedVer.tag : ''}`,
        `suggested_minor=${suggestions.minor}`,
        `suggested_minor_tag=${suggestions.minorTag}`,
        `suggested_patch=${suggestions.patch}`,
        `suggested_patch_tag=${suggestions.patchTag}`,
        `suggested_major=${suggestions.major}`,
        `suggested_major_tag=${suggestions.majorTag}`,
        `is_conflict=${conflictFound ? 'true' : 'false'}`
      ];
      try {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n', 'utf8');
      } catch (err) {
        // Ignore file write errors
      }
    }
  } else if (command === 'bump') {
    const targetVer = args[1];
    if (!targetVer) {
      console.error('Error: Please provide a target version. Example: node scripts/version-manager.js bump 1.1.0');
      process.exit(1);
    }

    const parsedTarget = parseSemver(targetVer);
    if (!parsedTarget) {
      console.error(`Error: "${targetVer}" is not a valid semantic version.`);
      process.exit(1);
    }

    if (releasedSet.has(parsedTarget.raw)) {
      console.error(`Error: Version tag "${parsedTarget.tag}" is already released!`);
      console.error(`Please choose an unreleased version (such as ${suggestions.minorTag} or ${suggestions.patchTag}).`);
      process.exit(1);
    }

    console.log(`Bumping all SDK manifests to version ${parsedTarget.raw}...`);
    const results = bumpAllManifests(parsedTarget.raw);
    results.forEach(msg => console.log(`  [OK] ${msg}`));
    console.log(`\nSuccessfully bumped all SDK manifests to ${parsedTarget.raw} (${parsedTarget.tag})!`);
  } else if (command === 'validate') {
    const targetVer = args[1];
    if (!targetVer) {
      console.error('Error: Please provide a version to validate.');
      process.exit(1);
    }

    const parsedTarget = parseSemver(targetVer);
    if (!parsedTarget) {
      console.error(`Error: "${targetVer}" is not a valid semantic version.`);
      process.exit(1);
    }

    if (releasedSet.has(parsedTarget.raw)) {
      console.error(`Conflict: Version ${parsedTarget.tag} has already been released!`);
      if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `\n> [!CAUTION]\n> **Release Failed**: Version \`${parsedTarget.tag}\` has already been released and cannot be re-published.\n> **Suggested alternatives**: \`${suggestions.minorTag}\` (minor) or \`${suggestions.patchTag}\` (patch).\n\n`,
          'utf8'
        );
      }
      process.exit(1);
    }

    console.log(`Validation passed: Version ${parsedTarget.tag} is valid and unreleased.`);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: check, bump <version>, validate <version>');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error in version-manager:', err);
    process.exit(1);
  });
}

module.exports = {
  parseSemver,
  compareSemver,
  getGitReleaseTags,
  getLocalVersions,
  computeSuggestions,
  bumpAllManifests
};
