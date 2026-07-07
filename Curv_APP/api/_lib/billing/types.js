/**
 * Provider-agnostic billing contracts for server-side integrations.
 *
 * @typedef {'BASE' | 'PRO'} BillingPlan
 * @typedef {'trialing' | 'active' | 'inactive'} BillingStatus
 *
 * @typedef {Object} CreateCheckoutInput
 * @property {string} clientId
 * @property {BillingPlan} plan
 * @property {string} [email]
 * @property {string} [cardTokenId]
 * @property {string} [successUrl]
 * @property {string} [cancelUrl]
 *
 * @typedef {Object} CreateSubscriptionInput
 * @property {string} clientId
 * @property {BillingPlan} plan
 * @property {string} [email]
 * @property {string} [cardTokenId]
 * @property {string} [successUrl]
 * @property {string} [cancelUrl]
 *
 * @typedef {Object} CheckoutResult
 * @property {string} url
 * @property {string} sessionId
 *
 * @typedef {Object} SubscriptionResult
 * @property {string} subscriptionId
 * @property {string} url
 * @property {BillingStatus} status
 *
 * @typedef {Object} SubscriptionStatus
 * @property {string} subscriptionId
 * @property {BillingStatus} status
 * @property {BillingPlan | null} plan
 * @property {string} clientId
 * @property {string} [payerEmail]
 * @property {string} [providerStatus]
 *
 * @typedef {Object} WebhookRequestContext
 * @property {import('http').IncomingMessage} req
 * @property {Buffer} rawBody
 * @property {Record<string, unknown>} payload
 *
 * @typedef {Object} WebhookResult
 * @property {boolean} handled
 * @property {string} [message]
 *
 * @typedef {Object} BillingProvider
 * @property {string} id
 * @property {(input: CreateCheckoutInput) => Promise<CheckoutResult>} createCheckout
 * @property {(input: CreateSubscriptionInput) => Promise<SubscriptionResult>} createSubscription
 * @property {(subscriptionId: string) => Promise<void>} cancelSubscription
 * @property {(subscriptionId: string) => Promise<SubscriptionStatus>} getStatus
 * @property {(context: WebhookRequestContext) => Promise<WebhookResult>} webhook
 */

export {};
