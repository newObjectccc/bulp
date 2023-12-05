import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import chooseFramework from '../common/choose-framework.js';
import choosePkgMgr from '../common/choose-pkg-manager.js';
import installPlugin from '../common/install-plugin.js';
import { DEPS_NEED_TO_INSTALL, ESLINT_FORMAT_TYPE } from '../helper/constant.js';
import { startOraWithTemp, stderrHdr, stdoutHdr } from '../helper/output.js';
import { installEslint, settingEslintrc } from './eslint-common.js';
const program = new Command();

const loadingEslintOra = ora({
  text: 'Download eslint',
});
const settingEslintOra = ora({
  text: `Setting eslint...`,
});
const downloadPluginOra = ora({
  text: 'Download plugin',
});

program
  .option('-f, --format <char>', 'default eslintrc.js if no specify')
  .action(async (fmt) => {
    try {
      // verify whether the parameters are valid
      if (fmt.format === void 0) fmt.format = 'js'
      if (!ESLINT_FORMAT_TYPE.includes(fmt.format)) {
        stderrHdr(` Parameter "--format" must be one of "${ESLINT_FORMAT_TYPE.join('|')}"`, loadingEslintOra)
        return
      }

      // download eslint
      const { pkgManager } = await choosePkgMgr()
      loadingEslintOra.start();
      await installEslint({ pkgManager, stdoutHdr: (data) => stdoutHdr(data, loadingEslintOra) })
      loadingEslintOra.succeed('ESLint download succeed');

      // choose framework
      const fwk = await chooseFramework()

      // setting eslintrc
      startOraWithTemp(settingEslintOra)
      settingEslintOra.text = chalk.green('Setting ESLint...')
      const writeRes = await settingEslintrc({ fmt: fmt.format, fwk: fwk.framework })
      settingEslintOra.succeed(`${writeRes} succeed!`)

      // install plugin
      startOraWithTemp(downloadPluginOra)
      const installPlugRes = await installPlugin({
        pkgManager,
        stdoutHdr: (data) => stdoutHdr(data, downloadPluginOra),
        plugin: DEPS_NEED_TO_INSTALL[fwk.framework]
      })
      downloadPluginOra.succeed(`${installPlugRes}, all completed!`)
    } catch (error) {
      loadingEslintOra.fail()
      settingEslintOra.fail()
      stderrHdr(error, downloadPluginOra)
    }
  });

program.parse();
