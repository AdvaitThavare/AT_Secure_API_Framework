# Certificate Setup Guide

This project uses HTTPS with mutual TLS (mTLS) for local development.

The repository does **not** contain development certificates or private keys. Generate your own local certificate set using OpenSSL.

## Certificate Structure

After setup, the local `certs` directory should contain:

```text
certs/
├── ca/
│   ├── ca.crt
│   └── ca.key
├── server/
│   ├── server.crt
│   └── server.key
└── client/
    ├── client.crt
    └── client.key
```

Private keys (`*.key`) must remain local and must never be committed.

## 1. Create the Local CA

```powershell
mkdir certs/ca
openssl genrsa -out certs/ca/ca.key 4096

openssl req -x509 -new -nodes `
  -key certs/ca/ca.key `
  -sha256 `
  -days 3650 `
  -out certs/ca/ca.crt `
  -subj "/C=IN/ST=Maharashtra/L=Thane/O=AT Secure API Framework/OU=Development/CN=AT Secure API Local CA"
```

## 2. Create the Server Certificate

```powershell
mkdir certs/server
openssl genrsa -out certs/server/server.key 2048

openssl req -new `
  -key certs/server/server.key `
  -out certs/server/server.csr `
  -subj "/C=IN/ST=Maharashtra/L=Thane/O=AT Secure API Framework/OU=Development/CN=localhost"
```

Create `certs/server/server.ext`:

```text
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=localhost
IP.1=127.0.0.1
```

Sign the server certificate:

```powershell
openssl x509 -req `
  -in certs/server/server.csr `
  -CA certs/ca/ca.crt `
  -CAkey certs/ca/ca.key `
  -CAcreateserial `
  -out certs/server/server.crt `
  -days 825 `
  -sha256 `
  -extfile certs/server/server.ext
```

## 3. Create the Client Certificate

```powershell
mkdir certs/client
openssl genrsa -out certs/client/client.key 2048

openssl req -new `
  -key certs/client/client.key `
  -out certs/client/client.csr `
  -subj "/C=IN/ST=Maharashtra/L=Thane/O=AT Secure API Framework/OU=Development/CN=AT Secure API Client"
```

Create `certs/client/client.ext`:

```text
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
```

Sign the client certificate:

```powershell
openssl x509 -req `
  -in certs/client/client.csr `
  -CA certs/ca/ca.crt `
  -CAkey certs/ca/ca.key `
  -CAcreateserial `
  -out certs/client/client.crt `
  -days 825 `
  -sha256 `
  -extfile certs/client/client.ext
```

## 4. Verify the Certificates

```powershell
openssl verify -CAfile certs/ca/ca.crt certs/server/server.crt
openssl verify -CAfile certs/ca/ca.crt certs/client/client.crt
```

Both commands should return:

```text
OK
```

## 5. Temporary Files

The following files are generated during certificate creation and should remain local:

```text
*.csr
*.srl
```

They are already excluded by the project's `.gitignore`.

## 6. Security

Never commit:

```text
*.key
*.csr
*.srl
.env
```

These certificates are intended for **local development/testing only**.

For production or partner environments, use the certificates and keys issued or required by that environment.

## Framework Configuration

The server configuration expects:

```text
certs/server/server.key
certs/server/server.crt
certs/ca/ca.crt
certs/client/client.crt
```

The generated client certificate and private key are also required when creating the client-side mTLS connection used by the test framework.
