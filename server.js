// server.js
// where your node app starts
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import moment from 'moment-timezone';
import WorkspaceRepository from './repositories/workspaceRepository';

require('dotenv/config');

const app = express();

// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: ['https://trello.com'] }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.get('/token/:link', async (req, res) => {
  if (!req.params.link) return res.status(404).send('Invalid.');
  const link = decodeURIComponent(req.params.link);

  /// TENTA PEGAR O TOKEN DO FIRESTORE
  let workspace = await WorkspaceRepository.findWorkspace(link);

  /// CRIA O WORKSPACE NO FIRESTORE SEM TOKEN
  if (!workspace) {
    workspace = await WorkspaceRepository.addWorkspace(link);
    console.log('Created workspace', workspace);
  } else
    console.log('Found workspace: ', {
      id: workspace.id,
      url: workspace.url,
    });

  if (!workspace.token) {
    /////// NÃO CADASTRADO, TEM QUE REDIRECIONAR PRA PEGAR AUTORIZAÇÃO E DEPOIS RETORNAR
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.CLIENT_ID}&scope=read%3Ajira-user%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fjiratrellointegration.herokuapp.com%2Fstore&state=${workspace.id}&response_type=code&prompt=consent`;
    console.log('No token, redirect to: ', url);
    return res.status(200).send({ redirect: true, url });
  }

  let id;
  try {
    /// PEGANDO O ID DA APLICAÇÃO
    const response = await axios.get(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${workspace.token}`,
          Accept: 'application/json',
        },
      }
    );
    id = response.data[0].id;
  } catch (err) {
    ///// TOKEN EXPIROU, ABRIR PARA PEGAR AUTORIZAÇÃO E DEPOIS RETORNAR

    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.CLIENT_ID}&scope=read%3Ajira-user%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fjiratrellointegration.herokuapp.com%2Fstore&state=${workspace.id}&response_type=code&prompt=consent`;
    console.log('Token expired, redirect to: ', url);
    return res.status(200).send({ redirect: true, url });
  }

  const { project, lastUpdated } = req.query;
  if (!project) return res.status(404).send('No project');

  //// ENDPOINT PARA PEGAR AS SUBTASKS
  let endpoint = `https://api.atlassian.com/ex/jira/${id}/rest/api/3/search?jql=project=${project} and issuetype="Subtarefa"`;

  //// SE FOI FORNECIDA UMA ÚLTIMA DATA
  if (lastUpdated) {
    let date = moment(parseFloat(lastUpdated))
      .tz('America/Sao_Paulo')
      .format('YYYY/MM/DD HH:mm');
    endpoint += ` and created>="${date}"`;
  }

  console.log('Hitting endpoint to get data: ', endpoint);

  try {
    //// PEGA AS SUBTASKS
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${workspace.token}`,
        Accept: 'application/json',
      },
    });
    // return res.status(200).send(response.data);
    const issues = response.data.issues.map((issue) => ({
      key: issue.key,
      title: issue.fields.summary,
    }));
    console.log('Returning issues!!!');
    return res.status(200).send(issues);
  } catch (err) {
    console.log(err.response.data);
    return res.status(404).send('Load data error.');
  }
});

app.get('/store', async (req, res) => {
  if (!req.query.code || !req.query.state)
    return res.status(404).send('Invalid parameters');

  try {
    const response = await axios.post(
      'https://auth.atlassian.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: 'https://jiratrellointegration.herokuapp.com/store',
      }
    );
    const token = response.data['access_token'];
    console.log('Got authorization token, inserting to workspace.');
    await WorkspaceRepository.addTokenToWorkspace(req.query.state, token);
    const workspace = await WorkspaceRepository.findWorkspaceById(
      req.query.state
    );
    if (workspace) return res.redirect(workspace.url);
    return res.status(404).send('Workspace not found!!');
  } catch (err) {
    console.log('Got the incorrect code!!!');
    return res.status(404).send('Code incorrect!');
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 8080, function () {
  console.info(`Node Version: ${process.version}`);
  console.log(
    'Trello Power-Up Server listening on port ' + listener.address().port
  );
});
