import path from 'path';
import fs from 'fs-extra';
import walk from './walk';

const logger = {
  debug: (msg: string): void => {
    console.debug(msg);
  }
};

interface PlaceholderConfig {
  projectName: string;
  placeholderName: string;
  placeholderTitle?: string;
  projectTitle?: string;
  packageName?: string;
  targetDir: string; 
}

const DEFAULT_TITLE_PLACEHOLDER = 'Hello App Display Name';

export function validatePackageName(packageName: string) {
  const packageNameParts = packageName.split('.');
  const packageNameRegex =
    /^([a-zA-Z]([a-zA-Z0-9_])*\.)+[a-zA-Z]([a-zA-Z0-9_])*$/u;

  if (packageNameParts.length < 2) {
    throw new Error(
      `The package name ${packageName} is invalid. It should contain at least two segments, e.g. com.app`
    );
  }

  if (!packageNameRegex.test(packageName)) {
    throw new Error(
      `The ${packageName} package name is not valid. It can contain only alphanumeric characters and dots.`
    );
  }
}

export async function replaceNameInUTF8File(
  filePath: string,
  projectName: string,
  templateName: string,
) {
  logger.debug(`Replacing in ${filePath}`);
  const fileContent = await fs.readFile(filePath, 'utf8');
  const replacedFileContent = fileContent
    .replace(new RegExp(templateName, 'g'), projectName)
    .replace(
      new RegExp(templateName.toLowerCase(), 'g'),
      projectName.toLowerCase(),
    );

  if (fileContent !== replacedFileContent) {
    await fs.writeFile(filePath, replacedFileContent, 'utf8');
  }
}

async function renameFile(filePath: string, oldName: string, newName: string) {
  const newFileName = path.join(
    path.dirname(filePath),
    path.basename(filePath).replace(new RegExp(oldName, 'g'), newName),
  );

  logger.debug(`Renaming ${filePath} -> file:${newFileName}`);

  await fs.rename(filePath, newFileName);
}

function shouldRenameFile(filePath: string, nameToReplace: string) {
  return path.basename(filePath).includes(nameToReplace);
}

function shouldIgnoreFile(filePath: string) {
  return !!filePath.match(
    /node_modules|yarn\.lock|package-lock\.json|\.(keystore|png|jpe?g|gif|bmp|tiff|ico)$/i,
  );
}

function isIosFile(filePath: string) {
  return filePath.includes('ios');
}

const UNDERSCORED_DOTFILES = [
  'buckconfig',
  'eslintrc.js',
  'flowconfig',
  'gitattributes',
  'gitignore',
  'prettierrc.js',
  'watchmanconfig',
  'editorconfig',
  'bundle',
  'ruby-version',
  'node-version',
  'xcode.env',
];

async function processDotfiles(filePath: string) {
  const dotfile = UNDERSCORED_DOTFILES.find((e) => filePath.includes(`_${e}`));

  if (dotfile === undefined) {
    return;
  }

  await renameFile(filePath, `_${dotfile}`, `.${dotfile}`);
}

async function createAndroidPackagePaths(
  filePath: string,
  packageName: string,
) {
  const pathParts = filePath.split('/').slice(-2);

  if (pathParts[0] === 'java' && pathParts[1] === 'com') {
    const pathToFolders = filePath.split('/').slice(0, -2).join('/');
    const segmentsList = packageName.split('.');

    if (segmentsList.length > 1) {
      const initialDir = process.cwd();
      process.chdir(filePath.split('/').slice(0, -1).join('/'));

      try {
        await fs.rename(
          `${filePath}/${segmentsList.join('.')}`,
          `${pathToFolders}/${segmentsList[segmentsList.length - 1]}`,
        );
        await fs.rmdir(filePath);

        for (const segment of segmentsList) {
          fs.mkdirSync(segment);
          process.chdir(segment);
        }
        await fs.rename(
          `${pathToFolders}/${segmentsList[segmentsList.length - 1]}`,
          process.cwd(),
        );
      } catch {
        throw new Error('Failed to create correct paths for Android.');
      }

      process.chdir(initialDir);
    }
  }
}

export async function replacePlaceholderWithPackageName({
  projectName,
  placeholderName,
  placeholderTitle,
  packageName,
  targetDir,
}: Omit<Required<PlaceholderConfig>, 'projectTitle'>) {
  validatePackageName(packageName);
  const cleanPackageName = packageName.replace(/[^\p{L}\p{N}.]+/gu, '');

  for (const filePath of walk(targetDir).reverse()) {
    if (shouldIgnoreFile(filePath)) {
      continue;
    }

    const iosFile = isIosFile(filePath);

    if (!(await fs.stat(filePath)).isDirectory()) {
      const newName = iosFile ? projectName : cleanPackageName;

      await replaceNameInUTF8File(
        filePath,
        `PRODUCT_BUNDLE_IDENTIFIER = "${cleanPackageName}"`,
        'PRODUCT_BUNDLE_IDENTIFIER = "(.*)"',
      );

      if (filePath.includes('app.json')) {
        await replaceNameInUTF8File(filePath, projectName, placeholderName);
      } else {
        const fileExtension = path.extname(filePath);

        if (fileExtension === '.java') {
          await replaceNameInUTF8File(
            filePath,
            `return "${projectName}"`,
            `return "${placeholderName}"`,
          );
        } else if (fileExtension === '.kt') {
          await replaceNameInUTF8File(
            filePath,
            `= "${projectName}"`,
            `= "${placeholderName}"`,
          );
        }

        await replaceNameInUTF8File(
          filePath,
          `<string name="app_name">${projectName}</string>`,
          `<string name="app_name">${placeholderTitle}</string>`,
        );

        await replaceNameInUTF8File(
          filePath,
          newName,
          `com.${placeholderName}`,
        );
        await replaceNameInUTF8File(filePath, newName, placeholderName);
        await replaceNameInUTF8File(filePath, newName, placeholderTitle);
      }
    }

    let fileName = cleanPackageName;

    if (shouldRenameFile(filePath, placeholderName)) {
      if (isIosFile(filePath)) {
        fileName = projectName;
      }

      await renameFile(filePath, placeholderName, fileName);
    } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
      await renameFile(
        filePath,
        placeholderName.toLowerCase(),
        fileName.toLowerCase(),
      );
    }
    try {
      await createAndroidPackagePaths(filePath, cleanPackageName);
    } catch (error) {
      throw new Error('Failed to create correct paths for Android.');
    }

    await processDotfiles(filePath);
  }
}

export async function changePlaceholderInTemplate({
  projectName,
  placeholderName,
  placeholderTitle = DEFAULT_TITLE_PLACEHOLDER,
  projectTitle = projectName,
  packageName,
  targetDir,
}: PlaceholderConfig) {
  logger.debug(`Changing ${placeholderName} for ${projectName} in template`);


  const originalCwd = process.cwd();
  process.chdir(targetDir);

  try {
    if (packageName) {
      await replacePlaceholderWithPackageName({
        projectName,
        placeholderName,
        placeholderTitle,
        packageName,
        targetDir
      });
    } else {
      for (const filePath of walk(process.cwd()).reverse()) {
        if (shouldIgnoreFile(filePath)) {
          continue;
        }
        if (!(await fs.stat(filePath)).isDirectory()) {
          await replaceNameInUTF8File(filePath, projectName, placeholderName);
          await replaceNameInUTF8File(filePath, projectTitle, placeholderTitle);
        }
        if (shouldRenameFile(filePath, placeholderName)) {
          await renameFile(filePath, placeholderName, projectName);
        } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
          await renameFile(
            filePath,
            placeholderName.toLowerCase(),
            projectName.toLowerCase(),
          );
        }

        await processDotfiles(filePath);
      }
    }
  } finally {
    process.chdir(originalCwd);
  }
}
