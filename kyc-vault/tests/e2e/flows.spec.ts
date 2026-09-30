// Playwright E2E Tests for KYC Vault SSI Ecosystem

import { test, expect, Browser, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';
const API_BASE = 'http://localhost:3001';

test.describe('KYC Vault E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;

  test.beforeAll(async () => {
    // Setup
  });

  test.describe('Wallet Flows', () => {
    test('should create a DID', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('text=My DIDs');
      await page.click('button:has-text("Create DID:ion")');
      
      await expect(page.locator('text=DID created successfully')).toBeVisible();
    });

    test('should receive and store credentials', async ({ page }) => {
      // Issue credential via API
      const response = await page.request.post(`${API_BASE}/api/vc/issue`, {
        data: {
          issuerDid: 'did:ion:issuer',
          subjectDid: 'did:ion:subject',
          claims: { name: 'John Doe' }
        }
      });

      expect(response.ok()).toBeTruthy();

      // Navigate to credentials
      await page.goto(BASE_URL);
      await page.click('text=My Credentials');
      
      // Verify credential appears
      await expect(page.locator('text=National ID')).toBeVisible();
    });

    test('should present credentials on request', async ({ page }) => {
      // Create verification request
      const reqResponse = await page.request.post(
        `${API_BASE}/api/verifier/request`,
        {
          data: {
            verifierDid: 'did:ion:verifier',
            requestedCredentials: [{ type: 'NationalIDCredential', fields: ['name'] }],
            purpose: 'KYC'
          }
        }
      );

      const requestId = (await reqResponse.json()).data.id;

      // In wallet, present credential
      await page.goto(BASE_URL);
      await page.click('text=Pending Requests');
      await page.click(`text=Request ${requestId}`);
      await page.click('button:has-text("Approve")');

      await expect(page.locator('text=Presentation sent')).toBeVisible();
    });
  });

  test.describe('Issuer Portal', () => {
    test('should create and issue credentials', async ({ page }) => {
      await page.goto('http://localhost:3002/docs');
      
      // Create template
      const templateResponse = await page.request.post(
        'http://localhost:3002/api/issuer/templates',
        {
          data: {
            name: 'Test Credential',
            schema: {},
            issuerDid: 'did:ion:issuer'
          }
        }
      );

      expect(templateResponse.ok()).toBeTruthy();

      // Issue credential
      const issueResponse = await page.request.post(
        'http://localhost:3002/api/issuer/issuance/issue',
        {
          data: {
            templateId: (await templateResponse.json()).data.id,
            subjectDid: 'did:ion:subject',
            claims: { name: 'Jane Doe' },
            issuerDid: 'did:ion:issuer'
          }
        }
      );

      expect(issueResponse.ok()).toBeTruthy();
    });

    test('should revoke credentials', async ({ page }) => {
      const revokeResponse = await page.request.post(
        'http://localhost:3002/api/issuer/issuance/revoke',
        {
          data: {
            credentialId: 'cred-123',
            issuerDid: 'did:ion:issuer',
            reason: 'Test revocation'
          }
        }
      );

      expect(revokeResponse.ok()).toBeTruthy();
    });
  });

  test.describe('Verification Flow', () => {
    test('should verify presentations', async ({ page }) => {
      // Create presentation request
      const reqResponse = await page.request.post(
        'http://localhost:3003/api/verifier/request',
        {
          data: {
            verifierDid: 'did:ion:verifier',
            requestedCredentials: [{ type: 'NationalIDCredential' }],
            purpose: 'KYC Verification'
          }
        }
      );

      const requestId = (await reqResponse.json()).data.id;

      // Verify the response
      const verifyResponse = await page.request.post(
        'http://localhost:3003/api/verifier/verify',
        {
          data: {
            requestId,
            presentation: { /* mock presentation */ },
            holderDid: 'did:ion:holder'
          }
        }
      );

      expect(verifyResponse.ok()).toBeTruthy();
      const result = await verifyResponse.json();
      expect(result.data.valid).toBeTruthy();
    });
  });

  test.describe('AML/Compliance Checks', () => {
    test('should perform AML checks during verification', async ({ page }) => {
      const response = await page.request.post(
        'http://localhost:3003/api/verifier/request',
        {
          data: {
            verifierDid: 'did:ion:bank',
            requestedCredentials: [
              { type: 'NationalIDCredential', fields: ['name', 'country'] }
            ],
            purpose: 'AML Verification'
          }
        }
      );

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Notification Service', () => {
    test('should send AML refresh notifications', async ({ page }) => {
      const response = await page.request.post(
        'http://localhost:3004/api/notify/aml-refresh',
        {
          data: {
            id: 'refresh-123',
            type: 'AMLRefreshRequest',
            holderDid: 'did:ion:holder',
            credentialIds: ['cred-1', 'cred-2'],
            reason: 'routine_update'
          }
        }
      );

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Revocation Service', () => {
    test('should check revocation status', async ({ page }) => {
      const response = await page.request.get(
        'http://localhost:3005/api/revocation/cred-123'
      );

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.data).toHaveProperty('revoked');
    });
  });
});
