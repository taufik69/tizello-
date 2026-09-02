---
description: Stage all changes, create a meaningful commit, and push the current branch
---

# Git Push Workflow

Execute the following workflow:

1. Check the current Git status:
   `git status`

2. Check the current branch:
   `git branch --show-current`

3. Review the changes:
   `git diff`
   `git diff --stat`

4. Check for sensitive files such as:
   - `.env`
   - `.env.*`
   - credentials
   - API keys
   - private keys
   - secrets

   Never stage or commit sensitive files.

5. Stage all safe changes:
   `git add .`

6. Review staged changes:
   `git diff --cached --stat`
   `git diff --cached`

7. Generate a concise, meaningful commit message based on the actual changes.

8. Create the commit:
   `git commit -m "<generated commit message>"`

9. Push the current branch:
   `git push`

10. If the branch has no upstream:
    `git push -u origin <current-branch>`

11. Report:
    - Current branch
    - Commit message
    - Commit hash
    - Push result

Important rules:

- Always add the changes before committing.
- Always create the commit before pushing.
- Never use `git push --force`.
- Never use `git reset --hard`.
- Never discard existing user changes.
- Never commit secrets or credentials.
- If there are merge conflicts, rebase conflicts, or another dangerous Git state, stop and ask the user.
- If there are no changes, do not create an empty commit. Report that there is nothing to commit.
