export const serverConfig = {
  host: '127.0.0.1',
  port: 8443,

  certificates: {
    key: 'certs/server/server.key',
    cert: 'certs/server/server.crt',
    ca: 'certs/ca/ca.crt',
    clientCert: 'certs/client/client.crt',
  },
};