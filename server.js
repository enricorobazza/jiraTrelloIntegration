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

app.get('/authenticate', async (req, res) => {
  if (req.query.link) {
    let workspace = await WorkspaceRepository.findWorkspace(req.query.link);
    if (workspace.length == 0)
      workspace = await WorkspaceRepository.addWorkspace(req.query.link);
    return res.status(200).send(workspace);
    // return res
    //   .status(200)
    //   .send(
    //     `<html><script>window.location.href="${decodeURIComponent(
    //       req.query.link
    //     )}"</script></html>`
    //   );
  } else if (req.query.code) return res.status(200).send(req.query.code);

  return res.status(404).send('Not found!');
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log(
    'Trello Power-Up Server listening on port ' + listener.address().port
  );
});
