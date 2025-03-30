# Lynx CLI

A CLI tool to initialize a new project from the `@gedeagas/lynx-template` with custom naming. This tool simplifies the process of creating new projects based on a predefined template, allowing you to specify the project name, a placeholder to be replaced within the template, and optionally a specific template version (git tag). You can also specify a package name and project title.

## Installation

```bash
npm install -g @gedeagas/lynx-cli
# or
yarn global add @gedeagas/lynx-cli
```

## Usage

```bash
init <projectName> [options]
```

### Arguments

*   `<projectName>`:  The name of the new project. This will be the name of the directory created for your project and will also be used to replace the placeholder in the template files.

### Options

*   `--placeholder <placeholder>`:  The placeholder string in the template files that will be replaced with the project name.  Defaults to `HelloWorld`.
*   `--version <version>`:  The version of the template to use (git tag).  Defaults to `latest`.
*   `--package-name <packageName>`:  The package name for the project (e.g., `com.example.app`).  This is particularly useful for mobile app development.
*   `--project-title <projectTitle>`: The project title (e.g., `App Name`). This will replace the default title placeholder in the template. Defaults to the project name.

### Examples

1.  Create a new project named "MyAwesomeApp" using the default placeholder and the latest template version:

    ```bash
    init MyAwesomeApp
    ```

2.  Create a new project named "MyCustomApp" replacing the placeholder "AppName" with the project name:

    ```bash
    init MyCustomApp --placeholder AppName
    ```

3.  Create a new project named "MyOldApp" using a specific template version (e.g., a git tag named "v1.0.0"):

    ```bash
    init MyOldApp --version v1.0.0
    ```

4.  Create a new React Native project named "MyMobileApp" with a specific package name and project title:

    ```bash
    init MyMobileApp --package-name com.example.mymobileapp --project-title "My Mobile App"
    ```

## How it Works

The CLI tool performs the following steps:

1.  **Clones the Template:** It uses `degit` to clone the `@gedeagas/lynx-template` repository (or a specific version) into a new directory named after your project.
2.  **Replaces Placeholders:** It then traverses the created project directory, replacing all occurrences of the specified placeholder with the project name in the text files. It also handles renaming files that contain the placeholder in their names.
3.  **Package Name Handling:** If a package name is provided, the tool validates it and replaces relevant placeholders in files like `app.json` and native code files (Java/Kotlin for Android, bundle identifiers for iOS). It also attempts to create the correct directory structure for Android package names.
4.  **Dotfile Handling:**  Renames underscored dotfiles (e.g., `_gitignore` to `.gitignore`).

## Contributing

This project is a work in progress. Contributions are welcome!

## License

MIT
