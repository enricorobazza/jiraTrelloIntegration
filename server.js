// server.js
// where your node app starts
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import moment from 'moment';
import WorkspaceRepository from './repositories/workspaceRepository';

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
  if (!workspace) workspace = await WorkspaceRepository.addWorkspace(link);

  if (!workspace.token) {
    /////// NÃO CADASTRADO, TEM QUE REDIRECIONAR PRA PEGAR AUTORIZAÇÃO E DEPOIS RETORNAR
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=vZt5e71iEcw45fesoHyBLBdzCe8Qpjc5&scope=read%3Ajira-user%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fjiratrellointegration.herokuapp.com%2Fauthenticate&state=${workspace.id}&response_type=code&prompt=consent`;
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
    const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=vZt5e71iEcw45fesoHyBLBdzCe8Qpjc5&scope=read%3Ajira-user%20read%3Ajira-work&redirect_uri=https%3A%2F%2Fjiratrellointegration.herokuapp.com%2Fauthenticate&state=${workspace.id}&response_type=code&prompt=consent`;
    return res.status(200).send({ redirect: true, url });
  }

  const { project, lastUpdated } = req.query;
  if (!project) return res.status(404).send('No project');

  //// ENDPOINT PARA PEGAR AS SUBTASKS
  let endpoint = `https://api.atlassian.com/ex/jira/${id}/rest/api/3/search?jql=project="${project}"%20and%20issuetype="Subtarefa"`;

  //// SE FOI FORNECIDA UMA ÚLTIMA DATA
  if (lastUpdated) {
    let date = moment.unix(lastUpdated).format('YYYY/MM/DD HH:mm:ss');
    endpoint += `%20and%20created&gt;="${date}"`;
  }

  try {
    //// PEGA AS SUBTASKS
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${workspace.token}`,
        Accept: 'application/json',
      },
    });
    return res.status(200).send(response.data);
  } catch (err) {
    return res.status(404).send('Load data error.');
  }
});

app.get('/authenticate', async (req, res) => {
  if (!req.query.code || !req.query.state)
    return res.status(404).send('Invalid parameters');

  try {
    const response = await axios.post(
      'https://auth.atlassian.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: 'vZt5e71iEcw45fesoHyBLBdzCe8Qpjc5',
        client_secret:
          'vh34u1Ln5Wx1WTdicPgx7AzI2WcBWT1qA066e4Z8j12FMBihEHRCyF1TccK3oa_1',
        code: req.query.code,
        redirect_uri:
          'https://jiratrellointegration.herokuapp.com/authenticate',
      }
    );

    const token = response.data['access_token'];
    const workspace = await WorkspaceRepository.addTokenToWorkspace(
      req.query.state,
      token
    );
    return res.status(200).send(workspace);
  } catch (err) {
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
