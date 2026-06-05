import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return Response.json({ error: 'No signature' }, { status: 400 });
        }

        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        );

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata.user_id;
                const planType = session.metadata.plan_type;

                if (userId && planType) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    const expiresDate = new Date(subscription.current_period_end * 1000);

                    await base44.asServiceRole.entities.User.update(userId, {
                        plan_type: planType,
                        subscription_expires: expiresDate.toISOString().split('T')[0],
                        stripe_subscription_id: subscription.id
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const users = await base44.asServiceRole.entities.User.filter({
                    stripe_customer_id: customerId
                });

                if (users.length > 0) {
                    const expiresDate = new Date(subscription.current_period_end * 1000);
                    
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        subscription_expires: expiresDate.toISOString().split('T')[0]
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                const users = await base44.asServiceRole.entities.User.filter({
                    stripe_customer_id: customerId
                });

                if (users.length > 0) {
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        plan_type: 'free',
                        subscription_expires: null,
                        stripe_subscription_id: null
                    });
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 400 });
    }
});