const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');


const createTag = async (tag) => {
    const client = github.getOctokit(core.getInput('token'))


    const commit_rsp = await client.rest.git.createCommit({
        ...github.context.repo,
        message: `New Version: ${tag}`,
        tree: github.context.sha,
        object: github.context.sha,
        type: 'commit'
    })
    console.log(JSON.stringify(commit_rsp))

    const tag_rsp = await client.rest.git.createTag({
      ...github.context.repo,
      tag,
      message: `v${tag}`,
      object: commit_rsp.sha,
      type: 'commit'
    })
    if (tag_rsp.status !== 201) {
      core.setFailed(`Failed to create tag object (status=${tag_rsp.status})`)
      return
    }
  
    const ref_rsp = await client.rest.git.createRef({
      ...github.context.repo,
      ref: `refs/tags/${tag}`,
      sha: tag_rsp.data.sha
    })
    if (ref_rsp.status !== 201) {
      core.setFailed(`Failed to create tag ref(status = ${tag_rsp.status})`)
      return
    }
  
    core.info(`Tagged ${tag_rsp.data.sha} as ${tag}`)
}

try {
  const packageRaw = fs.readFileSync('package.json');
  let packageInformation = JSON.parse(packageRaw);
  console.log(`The package Information: ${packageInformation.version} and name: ${packageInformation.name}`);
  const newVersion = core.getInput('new-version');
  console.log(`New version to get updated ${newVersion}!`);
  packageInformation.version = newVersion;
  fs.writeFileSync('package.json',JSON.stringify(packageInformation, null, 4));
  core.setOutput("link", "http://google.com");
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
  createTag(newVersion).catch((error) => {
    core.setFailed(error.message);
  })
  
} catch (error) {
  core.setFailed(error.message);
}