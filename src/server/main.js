const Koa = require('koa');
const createIntegration = require('github-integration');

const port = process.env.PORT || 1337;
const app = new Koa();

const integration = createIntegration({
  id: process.env.INTEGRATION_ID,
  cert: process.env.INTEGRATION_CERT,
});

app.use(async (ctx, next) => {
  if (ctx.url.match(/api/)) {
    console.log('api route', process.env.INTEGRATION_ID);
    ctx.body = { message: 'api' };
  } else {
    await next();
  }
});
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
