#!/usr/bin/env node

import { Command } from 'commander';
import degit from 'degit';
import path from 'path';
import fs from 'fs-extra';
import { changePlaceholderInTemplate } from './utils';

const program = new Command();

program
  .version('1.0.0')
  .argument('<projectName>', 'Name of the new project')
  .option(
    '--placeholder <placeholder>',
    'Placeholder in the template to replace',
    'HelloWorld'
  )
  .option(
    '--version <version>',
    'Template version to use (git tag)',
    'latest'
  )
  .option(
    '--package-name <packageName>',
    'Package name for the project (e.g., com.example.app)'
  )
  .option(
    '--project-title <projectTitle>',
    'Project title (e.g., App Name)'
  )
  .action(async (projectName: string, options: { placeholder: string, version: string, packageName?: string, projectTitle?: string }) => {
    const placeholder = options.placeholder;
    const version = options.version;
    const targetDir = path.join(process.cwd(), projectName);
    const repo = `gedeagas/lynx-template/template${version !== 'latest' ? `@${version}` : ''}`;


    if (fs.existsSync(targetDir)) {
      console.error(`Error: Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    // Clone the template repository using degit
    const emitter = degit(repo, {
      cache: false,
      force: true,
      verbose: true
    });

    console.log('Cloning template repository...');
    try {
        await emitter.clone(targetDir);
        console.log('Template cloned successfully.');
      
        console.log(
          `Replacing placeholder "${placeholder}" with project name "${projectName}"...`,
        );
        await changePlaceholderInTemplate({
          projectName,
          placeholderName: placeholder,
          projectTitle: options.projectTitle,
          packageName: options.packageName,
          targetDir,
        });
        console.log(`Project "${projectName}" created successfully.`);
      } catch (error: unknown) {
        // Narrow the error type before accessing properties
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'DEST_NOT_FOUND'
        ) {
          console.error(`Error: Version "${version}" not found in the repository.`);
        } else if (error instanceof Error) {
          console.error('Error creating project:', error.message);
        } else {
          console.error('Error creating project:', error);
        }
        process.exit(1);
    }
  });

program.parse(process.argv);
