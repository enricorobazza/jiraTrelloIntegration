// server.js
// where your node app starts
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import WorkspaceRepository from './repositories/workspaceRepository';

const app = express();

// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: ['https://trello.com'] }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.get('/code/:link', async (req, res) => {
  if (!req.params.link) return res.status(404).send('Invalid.');
  const link = decodeURIComponent(req.params.link);
  const workspace = await WorkspaceRepository.findWorkspace(link);
  return res.status(200).send(workspace.code);
});

app.get('/authenticate', async (req, res) => {
  if (req.query.link) {
    const link = decodeURIComponent(req.query.link);
    let workspace = await WorkspaceRepository.findWorkspace(link);
    if (!workspace) workspace = await WorkspaceRepository.addWorkspace(link);

    if (workspace.code)
      return res
        .status(200)
        .send(`<html><script>window.location.href="${link}"</script></html>`);

    const uri = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=vZt5e71iEcw45fesoHyBLBdzCe8Qpjc5&scope=read%3Ajira-user%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fjiratrellointegration.herokuapp.com%2Fauthenticate&state=${workspace.id}&response_type=code&prompt=consent`;

    return res
      .status(200)
      .send(`<html><script>window.location.href="${uri}"</script></html>`);
  } else if (req.query.code) {
    let workspace = await WorkspaceRepository.addCodeToWorkspace(
      req.query.state,
      req.query.code
    );
    return res.status(200).send(workspace);
  }

  return res.status(404).send('Not found!');
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log(
    'Trello Power-Up Server listening on port ' + listener.address().port
  );
});
