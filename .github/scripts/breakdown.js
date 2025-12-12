const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  const { issue } = require(process.env.GITHUB_EVENT_PATH);
  const { number: issueNumber, title, body, labels: existingLabels } = issue;
  const repo = process.env.GITHUB_REPOSITORY.split('/');
  const owner = repo[0];
  const repoName = repo[1];

  // Check if issue is an epic
  const isEpic = existingLabels.some(label => label.name === 'epic');
  if (!isEpic) {
    return;
  }

  // Create sub-issues
  const taskNames = [
    'Requirements Analysis',
    'Design and Architecture',
    'Implementation',
    'Testing and Documentation'
  ];

  for (let i = 0; i < taskNames.length; i++) {
    const taskName = taskNames[i];
    const taskNumber = i + 1;
    const taskTitle = `[SUBTASK] ${title} - Task ${taskNumber}: ${taskName}`;
    
    // Create sub-issue
    const subIssue = await octokit.rest.issues.create({
      owner,
      repo: repoName,
      title: taskTitle,
      body: `Related to #${issueNumber}`,
      labels: ['enhancement', 'needs-review']
    });
    
    const subIssueNumber = subIssue.data.number;
    
    // Update parent issue with epic tasks checklist
    const updatedBody = body + `\n\n## Epic Tasks\n- [ ] #${subIssueNumber} ${taskName}`;
    
    await octokit.rest.issues.update({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: updatedBody
    });
  }
}

main().catch(console.error);