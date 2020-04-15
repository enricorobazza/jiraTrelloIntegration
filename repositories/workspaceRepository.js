import getInstance from '../database';

const db = getInstance();
const workspacesRef = db.collection('workspaces');

const findWorkspace = async (url) => {
  const response = await workspacesRef.get();
  const docs = await response.docs.map((elem) => ({
    ...elem.data(),
    id: elem.id,
  }));

  return docs.filter((workspace) => workspace.url === url);
};

const addWorkspace = async (url) => {
  const workspace = await workspacesRef.add({ url });
  return { id: workspace.id, url };
};

export default { findWorkspace, addWorkspace };
