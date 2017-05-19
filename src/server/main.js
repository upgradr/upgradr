const Koa = require('koa');
const createIntegration = require('github-integration');
const createHandler = require('github-webhook-handler');
const expressToKoa = require('express-to-koa');

const port = process.env.PORT || 1337;
const app = new Koa();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.log(error);
  }
});

const integration = createIntegration({
  id: process.env.INTEGRATION_ID,
  cert: process.env.INTEGRATION_CERT,
});

const handler = createHandler({
  path: '/api',
  secret: process.env.INTEGRATION_SECRET,
});

handler.on('issues', event => {
  if (event.payload.action === 'opened') {
    const { installation } = event.payload;

    integration.asInstallation(installation.id).then(github => {
      console.log(event);
    });
  }
});

handler.on('pull_request', event => {
  const { installation, pull_request, repository } = event.payload;

  integration.asInstallation(installation.id).then(github => {
    console.log(event);
    try {
      const data = {
        owner: repository.owner.login,
        repo: repository.name,
        sha: pull_request.head.sha,
        state: 'pending',
        // target_url: 'https://example.com',
        description: 'checking... [ 1/3 ]',
        context: 'upgradr',
      };

      github.repos.createStatus(data);
      setTimeout(() => {
        github.repos.createStatus({
          owner: repository.owner.login,
          repo: event.payload.repository.name,
          sha: pull_request.head.sha,
          state: 'pending',
          // target_url: 'https://example.com',
          description: 'checking... [ 2/3 ]',
          context: 'upgradr',
        });
      }, 10000);

      setTimeout(() => {
        github.repos.createStatus({
          owner: repository.owner.login,
          repo: event.payload.repository.name,
          sha: pull_request.head.sha,
          state: 'success',
          target_url: 'https://example.com',
          description: 'all up-to-date',
          context: 'upgradr',
        });
      }, 30000);
    } catch (error) {
      console.log(error);
    }
  });
});

handler.on('integration_installation', event => {
  const installation = event.payload.installation.id;

  integration.asInstallation(installation).then(() => {
    if (event.payload.action === 'created') {
      console.log('Integration installed', event.payload.installation);
    } else if (event.payload.action === 'deleted') {
      console.log('Integration uninstalled', event.payload.installation);
    }
  });
});

app.use(async (ctx, next) => {
  if (ctx.url.match(/api/)) {
    console.log('api route');
    await next();
  }
});
app.use(expressToKoa(handler));

app.use(async (ctx, next) => {
  if (ctx.url.match(/authorize/)) {
    console.log('authorize route');
    ctx.body = { message: 'authorize' };
  } else {
    await next();
  }
});
app.use(async (ctx, next) => {
  if (ctx.url.match(/setup/)) {
    console.log('setup route');
    ctx.body = { message: 'setup' };
  } else {
    await next();
  }
});

app.use(async (ctx, next) => {
  await next();
  ctx.body = { message: 'no route' };
});

if (!module.parent) app.listen(port);

module.exports = app;
