import prompts from 'prompts';
import execCmd from '../common/exec-cmd.js';
import installPlugin from '../common/install-plugin.js';
import writeFileByTemp from '../common/write-file.js';
import { startOraWithTemp, stdoutHdr } from '../helper/output.js';
import { COMMITLINT_TEMP } from '../helper/template.js';

export async function execSettingHuskyAndCommitlint(pkgManager) {
  const settingHuskyOra = startOraWithTemp(`Setting husky...`)
  await execCmd({
    cmdStr: `npm pkg set scripts.prepare="husky install"`,
    errMsg: 'Set scripts.prepare fail'
  })
  await execCmd({
    cmdStr: 'npm run prepare',
    errMsg: 'Run prepare fail'
  })
  await execCmd({
    cmdStr: `npx husky add .husky/commit-msg "npx --no-install commitlint --edit "$1""`,
    errMsg: 'Run husky add .husky/commit-msg fail'
  })
  settingHuskyOra.succeed('Set husky succeed!')

  // install prompt-cli if needed & set commintlint
  const res = await isPromptToCommit()
  const settingCommitCfgOra = startOraWithTemp(`Setting commitlint...`)
  if (res?.isPrompt) {
    await installPlugin({
      pkgManager,
      stdoutHdr: (data) => stdoutHdr(data, settingCommitCfgOra),
      plugin: '@commitlint/prompt-cli'
    })
    await execCmd({
      cmdStr: `npm pkg set scripts.commit="commit"`,
      stdoutHdr: (data) => stdoutHdr(data, settingCommitCfgOra),
      errMsg: 'Set scripts.commit fail'
    })
  }

  // write commitlint.config.js
  const execRes = await writeFileByTemp(COMMITLINT_TEMP, 'commitlint.config.js')
  if (!execRes) {
    settingCommitCfgOra.fail('You should use bup under the root directory of the project!')
    return
  }
  settingCommitCfgOra.succeed(execRes)
  return true
}

// choose prompt or not
async function isPromptToCommit() {
  const res = await prompts([
    {
      type: 'confirm',
      name: 'isPrompt',
      message: 'do you like use pormpt to commit?',
      initial: true
    }
  ])
  return res
}