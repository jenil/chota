# Contributing Guidelines
Thanks for wanting to help out with Chota! We appreciate it very much. We decided to outline a couple of things, in order to make your contributing process as smooth as possible.

**Steps**
1. [Find an Issue](#find-an-issue)
2. [Work on the fix](#work-on-the-fix)
3. [Open a Pull Request](#open-a-pull-request)
4. [Relax](#relax)

## Find an Issue
Whether you notice the problem by yourself, or found an open issue on our [issue tracker](https://github.com/jenil/chota/issues), it's nice to know that you've got our backs.

**New Issues**
- If you plan on fixing something you found yourself, **please [open a new issue](https://github.com/jenil/chota/issues/new)** before working on it, so we can discuss the solution together.
- When opening an issue, please include the browser and its version, operating system, and any other helpful info (such as a screenshot).
- We may see the issue and not get back to you. That doesn't mean that we object to the issue you raised.

## Work on the Fix
1. [Fork and clone](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) this repository.
2. Install dependencies with `yarn install` or `npm install`.
3. Create a new branch with a name such as `<your_username>/issue-45` or `feature-really-cool`.
4. When you're ready, start the css compiler (postcss) with `yarn watch` (or `npm run watch`). Write the css code in the `/src` folder, and postcss will compile it and output it to the `/dist` folder.
5. You can see your changes by opening `/test/index.html` in your browser. There's no local server, so you'll have to open the file itself in your browser (`file://Users/.../test/index.html`). If you are using VS Code, you can use [@ritwickdey](https://github.com/ritwickdey)'s awesome [live-server extension](https://ritwickdey.github.io/vscode-live-server/) to serve and reload the page in real-time.

## Open a Pull Request
> If you're new to contributing to open source, see <http://makeapullrequest.com/>.
0. When you're happy with your changes, run `yarn build` or `npm run build`. This will update `/dist/chota.min.css` to reflect any changes you made.
1. Open a new pull request, and include
  **a)** a short description of the changes you made, and
  **b)** a reference to the related issue (just "fixes #45" is fine).
2. You may be asked to revise your changes, so keep on your toes. Also, we *may* decide not accept the pull request entirely. It's that we don't like you, but...
3. Advance to [step #4](#relax)

## Relax
You're done! :unicorn: Thanks for joining the club. Now, go tell everyone about *this great new css framework you heard of*.
