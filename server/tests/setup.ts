/**
 * Jest setup file to ensure all source files are included in coverage reports
 * This loads all source files so coverage is collected even if they lack tests
 */

const glob = require('glob');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');
const sourceFiles = glob.sync('**/*.ts', {
  ignore: ['**/*.d.ts', 'index.ts'],
  cwd: srcPath
});

// Import (require) all source files to force Jest to include them in coverage
sourceFiles.forEach((file: string) => {
  try {
    require(path.join(srcPath, file));
  } catch (error) {
    // Silently ignore import errors (database connections, etc.)
  }
});
