import random

streams = {
    "SRE": [
        {
            "Service": "user-auth-service",
            "Symptoms / Error": "502 Bad Gateway from Nginx",
            "Description": "Users are unable to log in, Redis connections are timing out rapidly causing 502s at the edge.",
            "Root Cause": "Redis token cache evicted active sessions due to OOM limit reached without LRU policy configured.",
            "What Worked": "Flushed stale keys manually, Increased maxmemory to 4GB",
            "What Failed": "Restarting the auth pods (caused connection storms)",
            "Lesson Learned": "Always configure an eviction policy (like volatile-lru) when caching sessions, even if TTLs are present.",
            "Prevention": "Set maxmemory-policy to volatile-lru, Setup Datadog alert for Redis memory > 80%"
        },
        {
            "Service": "inventory-db",
            "Symptoms / Error": "Connection Pool Exhausted",
            "Description": "Postgres connection pool is 100% full, all new read queries are being queued and dropping.",
            "Root Cause": "Runaway unindexed query from the new catalog microservice caused 100% CPU on Postgres primary.",
            "What Worked": "Killed the active query via pg_stat_activity, Rolled back catalog service deployment",
            "What Failed": "Attempting to failover to read-replica",
            "Lesson Learned": "Code reviews must require EXPLAIN ANALYZE for any new database queries fetching collections.",
            "Prevention": "Add index on product_category column, Implement query timeout of 5s on catalog service"
        },
        {
            "Service": "payment-gateway",
            "Symptoms / Error": "Stripe Webhook Timeout",
            "Description": "Payments are completing at Stripe but our webhook processor is timing out, causing unfulfilled orders.",
            "Root Cause": "Third-party Stripe API webhook certificate expired, causing our ingress to reject validation callbacks.",
            "What Worked": "Temporarily bypassed strict cert validation to clear backlog, Updated root CA bundle",
            "What Failed": "Scaling up payment gateway replicas",
            "Lesson Learned": "External API certificate bundles need automated rotation and monitoring before expiration.",
            "Prevention": "Add Prometheus exporter for SSL cert expiration, Automate CA bundle updates via Ansible"
        },
        {
            "Service": "search-indexer",
            "Symptoms / Error": "Kafka Consumer Lag",
            "Description": "Consumer lag for search indexing has grown to 500k messages, searches are returning stale data.",
            "Root Cause": "Kafka consumer group rebalancing loop caused by max.poll.interval.ms being too low for heavy payloads.",
            "What Worked": "Increased max.poll.interval.ms to 300000, Restarted consumer group",
            "What Failed": "Deleting and recreating the Kafka topic",
            "Lesson Learned": "When processing heavy message payloads, default Kafka consumer timeout configs are usually insufficient.",
            "Prevention": "Tune consumer timeout configs in helm chart, Add alert for consumer group rebalance rate > 5/min"
        },
        {
            "Service": "kubernetes-cluster",
            "Symptoms / Error": "Node OOM Kills",
            "Description": "Multiple pods on worker-node-3 are being OOM killed in a loop, cluster autoscaler is thrashing.",
            "Root Cause": "Kubernetes Node ran out of ephemeral storage due to excessive application debug logging.",
            "What Worked": "Cordoned the affected node, Changed log level to INFO via ConfigMap",
            "What Failed": "Evicting pods manually",
            "Lesson Learned": "Container logs can take down a whole node if not rotated or capped.",
            "Prevention": "Set Docker log-opt max-size to 10m, Enforce log levels in production"
        }
    ],
    "DevOps": [
        {
            "Service": "ci-cd-pipeline",
            "Symptoms / Error": "GitHub Actions Disk Full",
            "Description": "Self-hosted runners are failing on the docker build step with 'no space left on device'.",
            "Root Cause": "GitHub Actions runner ran out of disk space during docker build because of dangling images.",
            "What Worked": "Ran docker system prune, Added cleanup step before build",
            "What Failed": "Rerunning the workflow",
            "Lesson Learned": "Self-hosted runners need aggressive, scheduled disk cleanup to handle large mono-repos.",
            "Prevention": "Add daily cron job for docker system prune, Monitor disk usage on runners"
        },
        {
            "Service": "terraform-state",
            "Symptoms / Error": "State Lock Error",
            "Description": "Production deployment is blocked because the DynamoDB state lock was not released from a prior aborted run.",
            "Root Cause": "State file locked indefinitely by a crashed CI job, preventing subsequent deployments.",
            "What Worked": "Manually broke the state lock using terraform force-unlock",
            "What Failed": "Re-triggering the deployment",
            "Lesson Learned": "CI jobs running Terraform must have guaranteed post-steps to release locks on failure.",
            "Prevention": "Configure S3/DynamoDB lock timeout, Handle trap signals in CI shell scripts"
        },
        {
            "Service": "helm-controller",
            "Symptoms / Error": "ArgoCD OutOfSync",
            "Description": "ArgoCD shows the core-services app as out of sync due to a manual kubectl patch applied during an incident.",
            "Root Cause": "ArgoCD out of sync due to a manual kubectl edit on a managed deployment.",
            "What Worked": "Hard refreshed ArgoCD application, Enabled auto-sync with prune",
            "What Failed": "Trying to merge the live state back into git",
            "Lesson Learned": "Never manually edit resources managed by GitOps controllers.",
            "Prevention": "Remove kubectl write access for developers, Enable ArgoCD auto-prune"
        },
        {
            "Service": "prometheus-stack",
            "Symptoms / Error": "High Cardinality OOM",
            "Description": "Prometheus server crashed and is crash-looping due to memory exhaustion from a bad metric label.",
            "Root Cause": "Prometheus ran out of memory digesting millions of high-cardinality metrics from a bad release.",
            "What Worked": "Added metric relabeling config to drop the offending labels, Increased memory limits",
            "What Failed": "Restarting Prometheus server",
            "Lesson Learned": "Applications MUST not include unbounded variable data (like user IDs) in metric labels.",
            "Prevention": "Audit all custom metrics, Implement Prometheus metric ingestion limits"
        },
        {
            "Service": "aws-network",
            "Symptoms / Error": "NAT Gateway ErrorPortAllocation",
            "Description": "Lambdas in private subnets are failing to reach external APIs due to NAT Gateway port exhaustion.",
            "Root Cause": "NAT Gateway port exhaustion caused by a misconfigured lambda making thousands of rapid external connections.",
            "What Worked": "Migrated Lambda to a public subnet temporarily, Fixed Lambda connection pooling",
            "What Failed": "Adding more NAT gateways (hit quota)",
            "Lesson Learned": "Serverless functions making external API calls need connection reuse.",
            "Prevention": "Enable TCP Keep-Alive in Lambda HTTP clients, Monitor NAT Gateway ErrorPortAllocation"
        }
    ],
    "Software Engineering": [
        {
            "Service": "user-profile-ui",
            "Symptoms / Error": "React Infinite Loop",
            "Description": "The profile page freezes the browser tab entirely on load due to a suspected useEffect missing dependency.",
            "Root Cause": "React infinite re-render loop triggered by a missing dependency array in a useEffect hook.",
            "What Worked": "Rolled back frontend deployment, Added empty dependency array to hook",
            "What Failed": "Clearing browser cache",
            "Lesson Learned": "useEffect hooks without dependency arrays will execute on every single render.",
            "Prevention": "Enable exhaustive-deps eslint rule, Add CI block on lint warnings"
        },
        {
            "Service": "cart-api",
            "Symptoms / Error": "N+1 Query Timeout",
            "Description": "API endpoint for fetching cart details takes >10s and times out for users with more than 50 items.",
            "Root Cause": "N+1 query problem when calculating cart totals for users with many items.",
            "What Worked": "Refactored ORM call to use eager loading, Scaled DB vertically to survive peak",
            "What Failed": "Adding caching at the API level (cache invalidation too complex)",
            "Lesson Learned": "ORMs can easily hide inefficient database access patterns.",
            "Prevention": "Add query logging in dev environment, Use DataLoaders for GraphQL resolvers"
        },
        {
            "Service": "notification-worker",
            "Symptoms / Error": "Memory Leak",
            "Description": "Background worker memory consumption grows linearly over 4 hours until it crashes.",
            "Root Cause": "Memory leak caused by unclosed database connections inside a loop.",
            "What Worked": "Added finally block to close connections, Increased worker replica count",
            "What Failed": "Increasing heap size",
            "Lesson Learned": "Resources must always be explicitly released in background workers.",
            "Prevention": "Use context managers (with statements) for all DB access, Add memory leak tests"
        },
        {
            "Service": "order-service",
            "Symptoms / Error": "Double Payment Processing",
            "Description": "Race condition allowing users to submit the checkout form twice, resulting in double charges.",
            "Root Cause": "Race condition in order state machine allowed double-processing of payments.",
            "What Worked": "Added pessimistic locking to the order row during processing, Processed refunds",
            "What Failed": "Relying on frontend disabling the submit button",
            "Lesson Learned": "Distributed systems require database-level locking for critical state transitions.",
            "Prevention": "Implement SELECT FOR UPDATE on payment processing, Add idempotency keys to Stripe"
        },
        {
            "Service": "mobile-app",
            "Symptoms / Error": "App Crash on Startup",
            "Description": "iOS app crashes immediately on splash screen for users running iOS 14 due to an unsupported SDK call.",
            "Root Cause": "Uncaught exception in third-party analytics SDK crashed the app on startup for iOS 14 users.",
            "What Worked": "Disabled the feature flag for the analytics SDK, Pushed OTA update",
            "What Failed": "Waiting for Apple App Store expedited review",
            "Lesson Learned": "Third-party SDKs must always be wrapped in try/catch and gated behind feature flags.",
            "Prevention": "Wrap SDK initialization, Expand automated testing to older OS versions"
        }
    ],
    "Security": [
        {
            "Service": "auth-gateway",
            "Symptoms / Error": "Credential Stuffing Attack",
            "Description": "Huge spike in failed logins originating from rotating proxy IP addresses bypassing standard rate limits.",
            "Root Cause": "API rate limiting bypassed by an attacker rotating through thousands of proxy IP addresses.",
            "What Worked": "Implemented device fingerprinting rate limits, Blocked known proxy ASNs",
            "What Failed": "Standard IP-based rate limiting",
            "Lesson Learned": "IP-based rate limiting is ineffective against distributed botnets.",
            "Prevention": "Deploy Cloudflare Bot Management, Require CAPTCHA for suspicious logins"
        },
        {
            "Service": "s3-storage",
            "Symptoms / Error": "Public Bucket Warning",
            "Description": "AWS GuardDuty alerted that a previously private bucket was modified to allow public read access.",
            "Root Cause": "Developer accidentally committed AWS access keys to a public GitHub repository.",
            "What Worked": "Instantly revoked the compromised keys via IAM, Rotated all related credentials",
            "What Failed": "Trying to scrub the git history",
            "Lesson Learned": "Secrets will eventually be leaked if humans are allowed to handle them directly.",
            "Prevention": "Implement GitHub secret scanning, Move all deployments to IAM Roles/OIDC"
        },
        {
            "Service": "admin-panel",
            "Symptoms / Error": "Reflected XSS",
            "Description": "Bug bounty report confirmed a reflected XSS vulnerability in the user search parameter of the admin dashboard.",
            "Root Cause": "Cross-Site Scripting (XSS) vulnerability in user feedback form allowed session hijacking.",
            "What Worked": "Sanitized the input using DOMPurify, Invalidated all active admin sessions",
            "What Failed": "Attempting to write custom regex filters",
            "Lesson Learned": "Never trust user input, and never write custom HTML sanitization logic.",
            "Prevention": "Enforce strict Content Security Policy (CSP), Audit all raw HTML renders"
        },
        {
            "Service": "legacy-api",
            "Symptoms / Error": "Broken Access Control",
            "Description": "An unauthenticated endpoint /api/v1/users/export is inadvertently exposing PII without a token.",
            "Root Cause": "Unauthenticated endpoint exposed internal user PII due to missing middleware.",
            "What Worked": "Applied emergency auth middleware to all legacy routes, Purged CDN cache",
            "What Failed": "Checking access logs (too much volume)",
            "Lesson Learned": "Authentication must be global and opt-out, rather than opt-in per route.",
            "Prevention": "Refactor router to apply global auth, Write automated unauthenticated access tests"
        },
        {
            "Service": "ci-pipeline",
            "Symptoms / Error": "Malicious Dependency",
            "Description": "Dependabot flagged that a minor version bump of an npm package contains a known supply chain payload.",
            "Root Cause": "Supply chain attack via a compromised npm package dependency.",
            "What Worked": "Pinned package to known safe version, Rebuilt and deployed application",
            "What Failed": "Running npm audit (did not catch zero-day)",
            "Lesson Learned": "Dependencies must be strictly pinned and audited for unexpected maintainer changes.",
            "Prevention": "Implement Dependabot security gates, Setup internal artifact registry"
        }
    ]
}

output_lines = []
output_lines.append("# Active Incident Scenarios with Resolution Inputs\n")

for stream_name, templates in streams.items():
    output_lines.append(f"\n### {stream_name} STREAM EXAMPLES ###\n")
    for i in range(100):
        t = templates[i % len(templates)]
        idx = i + 1
        output_lines.append(f"## Example {idx} ({stream_name})")
        
        service = t["Service"] if i < 5 else f"{t['Service']}-{random.choice(['prod', 'staging', 'eu', 'us', 'v2', 'legacy'])}"
        severity = random.choice(["SEV-1", "SEV-2", "SEV-3"])
        error_rate = f"{random.uniform(2.0, 95.0):.1f}%"
        db_utilization = f"{random.randint(10, 100)}%"
        recent_deployment = random.choice(["Yes", "No"])
        deployment_time = f"{random.randint(1, 48)} hours ago" if recent_deployment == "Yes" else "N/A"
        
        output_lines.append(f"Service: {service}")
        output_lines.append(f"Severity: {severity}")
        output_lines.append(f"Symptoms / Error: {t['Symptoms / Error']}")
        output_lines.append(f"Error Rate: {error_rate}")
        output_lines.append(f"DB Utilization: {db_utilization}")
        output_lines.append(f"Recent Deployment: {recent_deployment}")
        output_lines.append(f"Deployment Time: {deployment_time}")
        output_lines.append(f"Description: {t['Description']}")
        output_lines.append("")
        output_lines.append("--- User Input (For Approve & Resolve Form) ---")
        output_lines.append(f"Root Cause: {t['Root Cause']}")
        output_lines.append(f"What Worked: {t['What Worked']}")
        output_lines.append(f"What Failed: {t['What Failed']}")
        output_lines.append(f"Lesson Learned: {t['Lesson Learned']}")
        output_lines.append(f"Prevention: {t['Prevention']}")
        output_lines.append("-----------------------------------------------\n")

with open('new_data_4.txt', 'w') as f:
    f.write('\n'.join(output_lines))

print("Successfully generated new_data_4.txt with Resolution fields.")
