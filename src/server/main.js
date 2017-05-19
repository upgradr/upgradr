const Koa = require('koa');
const createIntegration = require('github-integration');
const createHandler = require('github-webhook-handler');
const expressToKoa = require('express-to-koa');

const port = process.env.PORT || 1337;
const app = new Koa();

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
    const installation = event.payload.installation.id;

    integration.asInstallation(installation).then(github => {
      github.issues.createComment({
        owner: event.payload.repository.owner.login,
        repo: event.payload.repository.name,
        number: event.payload.issue.number,
        body: 'Welcome to the robot uprising.',
      });
    });
  }
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
