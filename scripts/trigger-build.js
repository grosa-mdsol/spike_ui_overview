const shell = require('shelljs');
const path = require('path');
const axios = require('axios');

const TRAVIS_BASE_URL = 'https://api.travis-ci.com';
const TRAVIS_API_TOKEN = '7VO-eqb91OjopCjubCyCGA';
const REPO_NAME = 'grosa-mdsol%2Fspike_ui';

const options = {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Travis-API-Version": "3",
    // "Authorization": `token ${process.env.TRAVIS_API_TOKEN}`,
    "Authorization": `token ${TRAVIS_API_TOKEN}`,
  },
};

async function hasBranch(branch) {
  try {
    const test = await axios
      .get(`${TRAVIS_BASE_URL}/repo/${REPO_NAME}/branch/${branch}`, options);

    // console.log(test.data);

    return true;
  } catch (error) {
    return false;
  }
}

async function run() {
  console.log(`Fetching git branch name...`);

  const branchCommand = shell.exec('echo ${TRAVIS_PULL_REQUEST_BRANCH:-$TRAVIS_BRANCH}', {
    cwd: path.join(__dirname, '..'),
  });

  if (branchCommand.code !== 0) {
    console.error('Error getting git branch name');
    process.exit(-1);
  }

  const gitBranchName = branchCommand.stdout.trim();
  console.log(`Git branch name: ${gitBranchName}`);

  console.log('Calling Travis...');

  let remoteBranch = gitBranchName;
  if (await hasBranch(gitBranchName) === false) {
    remoteBranch = 'master';
  }

  // console.log('develop', await hasBranch('develop'));
  // console.log('master', await hasBranch('master'));

  try {
    const response = await axios
      .post(`${TRAVIS_BASE_URL}/repo/${REPO_NAME}/requests`, {
        request: {
          message: `Trigger build at spike_ui branch: ${gitBranchName}`,
          branch: remoteBranch,
          config: {
            merge_mode: 'deep_merge',
            env: {
              ROOSTER: 'Rooster Test',
              MODULE_BRANCH: gitBranchName,
              // matrix: ['ROOSTER="Rooster Test"'],
            },
          },
        },
      }, options);

      console.log('Triggered build of spike_ui');
      console.log(response.data);

    } catch (error) {
      console.log(error);
      process.exit(-1);
    }
}

run();
