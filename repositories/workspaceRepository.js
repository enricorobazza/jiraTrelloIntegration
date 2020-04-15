import getInstance from '../database';

const db = getInstance();
const workspacesRef = db.collection('workspaces');

const findWorkspace = async (url) => {
  const response = await workspacesRef.get();
  const docs = await response.docs.map((elem) => ({
    ...elem.data(),
    id: elem.id,
  }));

  const workspaces = docs.filter((workspace) => workspace.url === url);

  if (workspaces.length === 0) return false;
  else return workspaces[0];
};

const addWorkspace = async (url) => {
  const workspace = await workspacesRef.add({ url });
  return { id: workspace.id, url };
};

const addTokenToWorkspace = async (id, token) => {
  const workspace = await workspacesRef.doc(id).update({ token });
  return workspace;
};

export default { findWorkspace, addWorkspace, addTokenToWorkspace };
