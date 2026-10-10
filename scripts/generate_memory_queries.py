import random

streams = {
    "SRE": [
        "How did we fix the Redis OOM issue on the user-auth-service?",
        "What are the common causes of 502 Bad Gateway errors from Nginx?",
        "Show me past incidents where the Postgres connection pool was exhausted.",
        "What is the recommended runbook for dealing with Stripe webhook timeouts?",
        "Have we ever had Kafka consumer lag exceeding 100k messages?",
        "Why did worker-node-3 experience OOM kills last week?",
        "What was the root cause of the payment-gateway outage during the last deployment?",
        "How do we handle Elasticsearch query timeouts?",
        "Find postmortems related to Kubernetes cluster autoscaler thrashing.",
        "What mitigation steps were used when the inventory-db failed over?",
        "Show me all SEV-1 incidents related to the search-indexer.",
        "What did we learn from the DNS resolution failure incident?",
        "Are there any runbooks for handling high CPU utilization on the checkout-worker?",
        "How did we resolve the BGP route flapping issue in the datacenter?",
        "What is the standard response for 504 Gateway Timeouts at the load balancer?"
    ],
    "DevOps": [
        "How do I clear disk space on GitHub Actions self-hosted runners?",
        "What should I do if a Terraform state lock is stuck in DynamoDB?",
        "Why did ArgoCD show the core-services app as OutOfSync?",
        "How did we fix the Prometheus memory exhaustion loop?",
        "What causes NAT Gateway ErrorPortAllocation in AWS?",
        "Show me the postmortem for the expired artifact registry token.",
        "How do we manually unseal the HashiCorp Vault cluster?",
        "What is the runbook for when fluentd log aggregation buffers are full?",
        "Why did SonarQube crash with an OutOfMemoryError during CI?",
        "How to handle orphaned Spinnaker bake pipelines?",
        "Find incidents related to CI/CD pipeline failures caused by dangling docker images.",
        "What did we learn from the ArgoCD manual kubectl patch incident?",
        "Show me all runbooks related to AWS network troubleshooting.",
        "Have we had incidents where Elasticsearch rejected bulk inserts due to disk watermarks?",
        "How do we prevent Terraform from locking indefinitely on failure?"
    ],
    "Software Engineering": [
        "How did we fix the React infinite loop on the user profile page?",
        "What was the root cause of the N+1 query timeout in the cart-api?",
        "How was the memory leak in the notification background worker resolved?",
        "Show me the postmortem for the double payment processing race condition.",
        "Why did the mobile app crash on startup for iOS 14 users?",
        "How do we handle NaN predictions from the ML recommendation engine?",
        "What caused the Chrome headless zombie processes on the pdf-generator?",
        "Find incidents where user-uploaded images caused a C++ segfault.",
        "How did we mitigate timeouts in the fraud-detection-api?",
        "What is the runbook for handling 'Too many open files' in the chat-websocket?",
        "Show me past incidents involving missing dependency arrays in useEffect.",
        "What did we learn about using eager loading in the ORM?",
        "How do we prevent unclosed database connections in background workers?",
        "Have we had issues with third-party analytics SDKs crashing the app?",
        "What is the recommended fallback mechanism for synchronous ML checks?"
    ],
    "Security": [
        "How did we stop the credential stuffing attack on the auth-gateway?",
        "What was the root cause of the public S3 bucket exposure alert?",
        "Show me the postmortem for the reflected XSS vulnerability in the admin panel.",
        "How was the broken access control issue on the legacy-api fixed?",
        "What mitigation steps were used during the npm supply chain attack?",
        "Why did the new WAF rule cause false positive blocking?",
        "How do we handle an expired SAML assertion for the IAM authenticator?",
        "Find incidents where the vulnerability scanner was blocked by the service mesh.",
        "What is the runbook for responding to SSH brute force attacks on the bastion host?",
        "How did we resolve the write capacity exceeded error on the audit-logger?",
        "Show me past incidents involving IP-based rate limiting bypasses.",
        "What did we learn from the accidental commit of AWS access keys to GitHub?",
        "How do we prevent unauthenticated access to PII on legacy endpoints?",
        "Have we had issues with Dependabot missing zero-day vulnerabilities?",
        "What is the standard response for sudden spikes in 403 Forbidden errors from the WAF?"
    ]
}

output_lines = []
output_lines.append("# Memory Explorer Queries\n")
output_lines.append("Use these queries in the Memory Explorer search bar to test the AI's ability to recall and synthesize historical data.\n")

for stream_name, templates in streams.items():
    output_lines.append(f"\n### {stream_name} STREAM QUERIES ###\n")
    
    # Generate ~45 queries per stream by duplicating and tweaking the templates
    generated_queries = set()
    
    # First, add all the base templates
    for t in templates:
        generated_queries.add(t)
        
    # Then generate variations until we hit 45
    variations = [
        "Tell me about when {}.",
        "Search for {}.",
        "I need info on {}.",
        "Can you explain how we handled {}?",
        "Find runbooks for {}."
    ]
    
    while len(generated_queries) < 45:
        base = random.choice(templates)
        # Extract a keyword or phrase from the base query to put into a variation
        words = base.replace("?", "").split()
        if len(words) > 4:
            # Grab a chunk from the end of the query
            keyword_phrase = " ".join(words[-4:])
            var = random.choice(variations).format(keyword_phrase)
            generated_queries.add(var)
            
    for i, query in enumerate(list(generated_queries)[:45]):
        output_lines.append(f"{i+1}. {query}")
        
with open('memory_explorer.txt', 'w') as f:
    f.write('\n'.join(output_lines))

print("Successfully generated memory_explorer.txt with ~180 queries.")
