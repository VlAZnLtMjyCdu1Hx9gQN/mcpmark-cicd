const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  const { issue } = require(process.env.GITHUB_EVENT_PATH);
  const { number: issueNumber, title, body, labels: existingLabels, user } = issue;
  const repo = process.env.GITHUB_REPOSITORY.split('/');
  const owner = repo[0];
  const repoName = repo[1];

  // Check if issue author is a first-time contributor
  const isFirstTimeContributor = await isFirstTimeContributor(owner, repoName, user.login);
  if (isFirstTimeContributor) {
    await octokit.rest.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels: ['first-time-contributor']
    });
    
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: `Welcome to the project, @${user.login}! We appreciate your contribution.`
    });
  }

  // Check issue type and post appropriate response
  const bugIssue = existingLabels.some(label => label.name === 'bug');
  const epicIssue = existingLabels.some(label => label.name === 'epic');
  const maintenanceIssue = existingLabels.some(label => label.name === 'maintenance');

  if (bugIssue) {
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: 'Thank you for reporting this bug. Please review our [Bug Report Guidelines](link-to-guidelines) for more information on how to properly report bugs.'
    });
  } else if (epicIssue) {
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: 'Thank you for submitting this epic. Please review our [Feature Request Process](link-to-process) for more information on how to properly submit feature requests.'
    });
  } else if (maintenanceIssue) {
    await octokit.rest.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: 'Thank you for submitting this maintenance report. Please review our [Maintenance Guidelines](link-to-guidelines) for more information on how to properly submit maintenance reports.'
    });
  }

  // Set milestone for high priority issues
  const priorityCritical = existingLabels.some(label => label.name === 'priority-critical');
  const priorityHigh = existingLabels.some(label => label.name === 'priority-high');
  
  if (priorityCritical || priorityHigh) {
    await octokit.rest.issues.update({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      milestone: 'v1.0.0'
    });
  }

  // Change status from needs-triage to needs-review
  const needsTriage = existingLabels.some(label => label.name === 'needs-triage');
  if (needsTriage) {
    await octokit.rest.issues.removeLabel({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      name: 'needs-triage'
    });
    
    await octokit.rest.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels: ['needs-review']
    });
  }
}

async function isFirstTimeContributor(owner, repo, username) {
  // Check if user has any issues in this repo
  const issues = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    creator: username,
    state: 'all'
  });
  
  return issues.data.length === 0;
}

main().catch(console.error);