
import Promises from 'bluebird';
import pickBy from 'lodash.pickby';
import electronConvert from 'electron-html-to';
import recipe from './recipe';

class Electron {
  constructor(reporter, definition) {
    let {
      strategy,
      numberOfWorkers,
      pingTimeout,
      timeout,
      tmpDir,
      portLeftBoundary,
      portRightBoundary,
      host,
      chromeCommandLineSwitches,
      maxLogEntrySize
    } = definition.options;

    let convertOptions = {
      strategy,
      numberOfWorkers,
      pingTimeout,
      timeout,
      tmpDir,
      portLeftBoundary,
      portRightBoundary,
      host,
      chromeCommandLineSwitches,
      maxLogEntrySize
    };

    let shouldAccessLocalFiles;

    // filter undefined options
    convertOptions = pickBy(convertOptions, (val) => val !== undefined);

    this.reporter = reporter;

    reporter.extensionsManager.recipes.push({
      name: 'electron-pdf',
      execute: Electron.prototype.execute.bind(this)
    });

    reporter.documentStore.registerComplexType('ElectronType', {
      marginsType: { type: 'Edm.Int32' },
      // header: { type: 'Edm.String', document: { extension: 'html', engine: true } },
      // headerHeight: { type: 'Edm.String' },
      // footer: { type: 'Edm.String', document: { extension: 'html', engine: true } },
      // footerHeight: { type: 'Edm.String' },
      landscape: { type: 'Edm.Boolean' },
      format: { type: 'Edm.String' },
      printBackground: { type: 'Edm.Boolean' },
      width: { type: 'Edm.Int32' },
      height: { type: 'Edm.Int32' },
      printDelay: { type: 'Edm.Int32' },
      blockJavaScript: { type: 'Edm.Boolean' },
      waitForJS: { type: 'Edm.Boolean' }
    });

    if (reporter.documentStore.model.entityTypes.TemplateType) {
      // eslint-disable-next-line no-param-reassign
      reporter.documentStore.model.entityTypes.TemplateType.electron = {
        type: 'jsreport.ElectronType'
      };
    }

    shouldAccessLocalFiles = definition.options.hasOwnProperty('allowLocalFilesAccess') ?
                              definition.options.allowLocalFilesAccess : false;

    if (!reporter.__electron_html_to__) {
      // eslint-disable-next-line no-param-reassign
      reporter.__electron_html_to__ = Promises.promisify(electronConvert({
        ...convertOptions,
        allowLocalFilesAccess: shouldAccessLocalFiles
      }));
    }
  }

  execute(request, response) {
    // eslint-disable-next-line no-param-reassign
    request.template.electron = request.template.electron || {};

    this.reporter.logger.debug('Electron Pdf recipe start.');

    return recipe(this.reporter, this.reporter.__electron_html_to__, request, response);
  }
}

export default function(reporter, definition) {
  // eslint-disable-next-line no-param-reassign
  definition.options = Object.assign({}, reporter.options.electron, definition.options);

  // eslint-disable-next-line no-param-reassign
  definition.options.strategy = definition.options.strategy || 'dedicated-process';
  // eslint-disable-next-line no-param-reassign
  definition.options.tmpDir = reporter.options.tempAutoCleanupDirectory;

  // eslint-disable-next-line no-param-reassign
  reporter[definition.name] = new Electron(reporter, definition);
}
