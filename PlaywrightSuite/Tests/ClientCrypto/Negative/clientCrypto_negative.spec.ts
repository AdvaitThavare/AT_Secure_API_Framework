import { test } from '../../../apiSetup/apiContext';
import { expect } from '@playwright/test';


test('CRY_NEG_004_JWEDecryptMissingOrInvalidEncResPayload', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWE', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {},
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWE_REQUEST',
        message: 'encResPayload must be a string',
    });
});

test('CRY_NEG_005_JWEDecryptMalformedJWE', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWE', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResPayload: 'invalid.jwe.payload',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWE',
        message: 'Invalid JWE format',
    });
});

test('CRY_NEG_006_JWEDecryptInvalidEncryptedKey', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWE', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            "encResPayload": "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIiwidHlwIjoiSldFIn0.b9MNdoUqr5JT-Z-UAnsM4LmVIxcIeFASocs5ks50caZkO3cZpyjMdybKYFi3UIHA4hXQn4uzpbLVI5YfictlCD881Ry3MBVKx9z7JB_fmS5acoeNn5p7jXLzREN0J10GpMXJctgx71HH3DpPtcAnfQRjjwaP76YF46k3Ry5UjEJxSWB_Lj1GEZiXO0Ot33qE_lpr5SKWfOY8n4xUpDhddV5pWvdAVJE4FaHpsvmz8JxZOoZ1g-DNiwg7AlwBebJCLCJw0miqKH8o0oxSDqrcZLWHeKfruXi_zWQ3ilNjQcmOtZUBaDsVYweGJWC13TwIEsrRq3dhie2j5lo14mwhCQ.TRfKdp4SOxTAfks0.6EA92JWTbIIc1NlKVwMWwWLj2fkL3Pj1d9HstnknFqAYfWzoGWxUFyVTZ0ZmIlFqnKRO1GB7Ml3-Qvo45WaZAmigrELvUUQ.KM3dazTZpUcAyPcBjmT62Q",
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_ENCRYPTED_KEY',
        message: 'Failed to decrypt content encryption key',
    });
});

test('CRY_NEG_007_JWEDecryptInvalidJWEPayload', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWE', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            "encResPayload": "eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0NNIiwidHlwIjoiSldFIn0.g9MNdoUqr5JT-Z-UAnsM4LmVIxcIeFASocs5ks50caZkO3cZpyjMdybKYFi3UIHA4hXQn4uzpbLVI5YfictlCD881Ry3MBVKx9z7JB_fmS5acoeNn5p7jXLzREN0J10GpMXJctgx71HH3DpPtcAnfQRjjwaP76YF46k3Ry5UjEJxSWB_Lj1GEZiXO0Ot33qE_lpr5SKWfOY8n4xUpDhddV5pWvdAVJE4FaHpsvmz8JxZOoZ1g-DNiwg7AlwBebJCLCJw0miqKH8o0oxSDqrcZLWHeKfruXi_zWQ3ilNjQcmOtZUBaDsVYweGJWC13TwIEsrRq3dhie2j5lo14mwhCQ.TRfKdp4SOxTAfks0.6EA92JWTbIIc1NlKVwMWwWLj2fkL3Pj1d9HstnknFqAYfWzoGWxUFyVTZ0ZmIlFqnKRO1GB7Ml3-Qvo45WaZAmigrELvUUP.KM3dazTZpUcAyPcBjmT62Q",
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWE_PAYLOAD',
        message: 'Failed to decrypt JWE payload',
    });
});

test('CRY_NEG_008_AESRSADecryptMissingEncryptedPayload', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptAES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResKey: 'dummy',
            base64iv: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_009_AESRSADecryptMissingEncryptedKey', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptAES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResPayload: 'dummy',
            base64iv: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_010_AESRSADecryptMissingIV', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptAES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResPayload: 'dummy',
            encResKey: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_011_AESRSADecryptInvalidEncryptedData', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptAES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            "encResPayload": "8+KPoojRvppQ3w2JD0yQi9nIcXJHx7A/KheC5JmFYvDFSXKewRMOunSMyAVaYoV2BX2IKxi7DnGyLzhQ/nWYLBR++U27QHNhiD/t3CmrJY=",
            "encResKey": "cMWqK0qsswIsMaOoax2FnsQc/oMoItX48AuvCk+VaESYIATyto+26UROapjOmxd1gWnOhNQGOxhtp2RMwee3WuxcMeHkAM8/1MhzTSbym1iPKB1NuKu7KSGx0TtLHfB2+wPC/VraohA8t1JrokV86/V7qnpQjxqiTkjRQkOMJXrUMauFVKHH0EBh+f+IdDj6bsurgMsB5duDGYKQ8sY+sYK7fG7TjeQK1FCHCyOq+WClaewmsu2Hd+66gFGzx+rHq2pVFfran42r9BJAHDkyV2lux1FMsnMnizEhOOVrbIhsZoGXYuaMON25X79sDCC/X2rXiWm3yrzBsYwBUX0tjA==",
            "base64iv": "EUOyCOdfgYqT8RMJi8o9Rw=="
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_AES_RSA_PAYLOAD',
        message: 'Failed to decrypt AES_RSA payload',
    });
});

test('CRY_NEG_012_JWSAESRSADecryptMissingEncryptedPayload', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWS_AES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResKey: 'dummy',
            base64iv: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWS_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_013_JWSAESRSADecryptMissingEncryptedKey', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWS_AES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResPayload: 'dummy',
            base64iv: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWS_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_014_JWSAESRSADecryptMissingIV', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWS_AES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            encResPayload: 'dummy',
            encResKey: 'dummy',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWS_AES_RSA_REQUEST',
        message: 'encResPayload, encResKey and base64iv must be strings',
    });
});

test('CRY_NEG_015_JWSAESRSAInvalidJWSSignature', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWS_AES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            "encResPayload": "nwEdz9KmtnFwPHmtg/BYYOewxdudtxLZfnkZhRj3F2lhWA/29FjgSnPRJvhmiXEyZqBBL1dFmTWkiJ+vyYkbV/WXSdk7xzh3aLFxTycVgx7c5+JLv+j9MOlQPBuLfLJQ+muzclu9sbi6/FvvUj/PaE456Wo4dhSqpLcMEMW7daGmLewO4nTYFKgrkYfnMcxLJFQW+conNtRlZ0Hx0cVJIJjeuV0V0njODblCWQ1jblNsTTbGl98GVhGxzD5HtWK0WOfEPHDpVIYKiMsEXxuQJfgdQR/SJdFzeftBa4AdzjVp1v40KBdpoCZuuBhXlRlTSH8g0MfnWBH2YaEp5qOwksR9upJ1EhHIPugtaF+Au1XRSnuxYuUPbSDQtkrTf8DXJwT4pL1DF9s/qyC7YpGu9EOTG/xKCQYmsQOOOBleeOi3PwKCFaOgBd8SuuTayGa/My/9qne1D1yF4PwbSPi8rKfQ8SFX89oz2be3ZTRrIl+IoMJaMK76BcygxEd48cy69UZ7haCjheuXojxba5Ae04OxN9qwUq4HET28nlXQo9Zsg0k54IdrX1HIeYdxbIQzO+qnrAA4v1nTynHBHyxHuS8udpFAAi0TfgFhPsI8Rb8PCrLpd7zQFgva0JILOH2v",
            "encResKey": "Hob2cROFQjHwQuQT95rRYfo/pK75jnnAGVAICYdlSiub4pxR5DnnvwiVyQBJMUo6Nosrydo7/ht3PiiC/oPrKo58nooEg53e7Gkr7qgefCvBxy8/BrxSQ2oWr4g35cEnA2B/ojGpD+EKquJ6qA6oA+g31XNaiFKujnF1FwjSWgGbXyhTV4yFOjbTPI0v1/rTo5EOxyI1vRNhti9R/A4F3k3ki7Jnov5KtjEUfQTPNq7Ww7kpXnqPFdXB5MF8U7tmS/Wzx4uL6UsjzXZpPAG+/zUcyKTuwcYHSA8KTGFTexBVMkjDv/WIcaXIzKa9As+ezDOYAJcE2mse7bn7y0/xFQ==",
            "base64iv": "NMxt4UbGdJhKswTmTHRR7Q==",
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWS_SIGNATURE',
        message: 'JWS signature verification failed',
    });
});

test('CRY_NEG_016_JWSAESRSAInvalidCryptographicContent', async ({ apiContext }) => {
    const response = await apiContext.fetch('/clientCryptography/decryptJWS_AES_RSA', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            "encResPayload": "drpzixKdjJpXzGhSGxJyf+hA3QqHNmagYgWoeXBvxcEZJRfXrFVo4YM0YAKlqNtPh9TgMMfsmIfJplTHnbb4Ms+z4LQOM2ZdOkqJH3m35T9LsIbnD4FhwmB8S9cGEVymI25Zv3fj6zf1yc+5EA2ohijBq9SwzzlRXSat7BC+ix86aWbVGIM0rI2KcWKtfl647fla8pt+9dTEnzuFEPAH2Tjq7dDhpOYWIVy1CLMUhx75D4nPtIyxTL/H4hxxyoZDuqPlpkYuUeIl8277bnpD2II78xbkuCqB563OsoybVjixRugHSisvzeYatUM4nXd/kE7CTAy8668oHkV/x5KOTZ34+6ZVP7NTBBOajJNBgql8eVvo9MlcVqF3KJ2sFG8ROUA+RN9XrxTFfh8URSTrjIpzckskojnUKOJPVFuOuyn84efvcxEH6VQD4MK5abbjQUGPoI+H2woukZOQUxYfDTZjRM1Doj+TCf1orJ1ULY0RfxakZ2rPGBhh1q2vpdXvpIJqMxINFj2U3ceC+5tLQSJQaviilWti8G/3kTD9SblviTGVdeTbyKjKUP0dW02n3FNpzkWR35XlGFMnBWvFAXL0ObFo1465T9Ew1FxaN4UWf0ZrjVUIFxAaZiERtK",
            "encResKey": "fLGP1anvgSnvO0Jur43TL4Ge2E/oU1X8CapUjzvXgb+DYbwIF5HvKjK19XugGHIR4fMXbciUfElwnTa2KGaJAImBRc5jAFtJjqDpWTABBP6r4re8hAKOHmxhPa1wR548sUyEIrJzUZNXaZaXsgALhTPGjBiN08hATm8qRPaS78RKjPNqNch62yDWkuQ+xfaOkAOlnCQry0vBKwlugPMbHi2lLXk58md3OHcOGje5Br+FNE18w8YhF+Nq7ZVAP2daH/qGYViPBuqoiSRHmd0Wi/CLfGOzSCaVk1uno5dIVqMJ1D6ZfpZ8S+XbWqa2L6rT2sG7c93oS17VcUT9ntvm/Q==",
            "base64iv": "uWyIc4Hqn1rgr1+O+3UNZA==",
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        errorCode: 'INVALID_JWS_AES_RSA_PAYLOAD',
        message: 'Failed to decrypt JWS_AES_RSA payload',
    });
});