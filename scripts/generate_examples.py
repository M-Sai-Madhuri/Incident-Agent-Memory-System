import os

streams = {
    "SRE": [
        {
            "Service / Component": "user-auth-service",
            "Root Cause": "Redis token cache evicted active sessions due to OOM limit reached without LRU policy configured.",
            "What Worked": "Flushed stale keys manually, Increased maxmemory to 4GB",
            "What Failed": "Restarting the auth pods (caused connection storms)",
            "Lessons Learned": "Always configure an eviction policy (like volatile-lru) when caching sessions, even if TTLs are present.",
            "Action Items / Prevention": "Set maxmemory-policy to volatile-lru, Setup Datadog alert for Redis memory > 80%",
            "Resolution Steps": "Increased limits, Redeployed"
        },
        {
            "Service / Component": "inventory-db",
            "Root Cause": "Runaway unindexed query from the new catalog microservice caused 100% CPU on Postgres primary.",
            "What Worked": "Killed the active query via pg_stat_activity, Rolled back catalog service deployment",
            "What Failed": "Attempting to failover to read-replica",
            "Lessons Learned": "Code reviews must require EXPLAIN ANALYZE for any new database queries fetching collections.",
            "Action Items / Prevention": "Add index on product_category column, Implement query timeout of 5s on catalog service",
            "Resolution Steps": "Killed query, Rolled back"
        },
        {
            "Service / Component": "payment-gateway",
            "Root Cause": "Third-party API webhook certificate expired, causing ingress to reject validation callbacks.",
            "What Worked": "Temporarily bypassed strict cert validation to clear backlog, Updated root CA bundle",
            "What Failed": "Scaling up replicas",
            "Lessons Learned": "External API certificate bundles need automated rotation and monitoring before expiration.",
            "Action Items / Prevention": "Add Prometheus exporter for SSL cert expiration, Automate CA bundle updates",
            "Resolution Steps": "Bypassed validation, Updated CA"
        },
        {
            "Service / Component": "search-indexer",
            "Root Cause": "Kafka consumer group rebalancing loop caused by max.poll.interval.ms being too low.",
            "What Worked": "Increased max.poll.interval.ms to 300000, Restarted consumer group",
            "What Failed": "Deleting and recreating the Kafka topic",
            "Lessons Learned": "When processing heavy message payloads, default Kafka consumer timeout configs are usually insufficient.",
            "Action Items / Prevention": "Tune consumer timeout configs in helm chart, Add alert for consumer group rebalance rate",
            "Resolution Steps": "Tuned Kafka limits, Restarted consumers"
        },
        {
            "Service / Component": "checkout-worker",
            "Root Cause": "Node.js event loop blocked by synchronous JSON.parse on a massive payload.",
            "What Worked": "Filtered out massive payloads at the API gateway, Deployed hotfix using streaming parser",
            "What Failed": "Increasing pod memory limits",
            "Lessons Learned": "Never use synchronous operations on unbounded external inputs in Node.js.",
            "Action Items / Prevention": "Replace JSON.parse with stream-json, Enforce payload limit at Nginx",
            "Resolution Steps": "Deployed streaming fix, Added API limit"
        }
    ],
    "DevOps": [
        {
            "Service / Component": "ci-cd-pipeline",
            "Root Cause": "GitHub Actions runner ran out of disk space during docker build because of dangling images.",
            "What Worked": "Ran docker system prune, Added cleanup step before build",
            "What Failed": "Rerunning the workflow",
            "Lessons Learned": "Self-hosted runners need aggressive, scheduled disk cleanup to handle large mono-repos.",
            "Action Items / Prevention": "Add daily cron job for docker system prune, Monitor disk usage on runners",
            "Resolution Steps": "Cleaned up disk, Restarted pipeline"
        },
        {
            "Service / Component": "terraform-state",
            "Root Cause": "State file locked indefinitely by a crashed CI job, preventing subsequent deployments.",
            "What Worked": "Manually broke the state lock using terraform force-unlock",
            "What Failed": "Re-triggering the deployment",
            "Lessons Learned": "CI jobs running Terraform must have guaranteed post-steps to release locks on failure.",
            "Action Items / Prevention": "Configure S3/DynamoDB lock timeout, Handle trap signals in CI shell scripts",
            "Resolution Steps": "Forced unlock, Reran apply"
        },
        {
            "Service / Component": "helm-controller",
            "Root Cause": "ArgoCD out of sync due to a manual kubectl edit on a managed deployment.",
            "What Worked": "Hard refreshed ArgoCD application, Enabled auto-sync with prune",
            "What Failed": "Trying to merge the live state back into git",
            "Lessons Learned": "Never manually edit resources managed by GitOps controllers.",
            "Action Items / Prevention": "Remove kubectl write access for developers, Enable ArgoCD auto-prune",
            "Resolution Steps": "Hard refresh, Auto-synced"
        },
        {
            "Service / Component": "prometheus-stack",
            "Root Cause": "Prometheus ran out of memory digesting millions of high-cardinality metrics from a bad release.",
            "What Worked": "Added metric relabeling config to drop the offending labels, Increased memory limits",
            "What Failed": "Restarting Prometheus server",
            "Lessons Learned": "Applications MUST not include unbounded variable data (like user IDs) in metric labels.",
            "Action Items / Prevention": "Audit all custom metrics, Implement Prometheus metric ingestion limits",
            "Resolution Steps": "Dropped bad metrics, Scaled resources"
        },
        {
            "Service / Component": "aws-network",
            "Root Cause": "NAT Gateway port exhaustion caused by a misconfigured lambda making thousands of rapid external connections.",
            "What Worked": "Migrated Lambda to a public subnet temporarily, Fixed Lambda connection pooling",
            "What Failed": "Adding more NAT gateways (hit quota)",
            "Lessons Learned": "Serverless functions making external API calls need connection reuse.",
            "Action Items / Prevention": "Enable TCP Keep-Alive in Lambda HTTP clients, Monitor NAT Gateway ErrorPortAllocation",
            "Resolution Steps": "Fixed lambda config, Flushed connections"
        }
    ],
    "Software Engineering": [
        {
            "Service / Component": "user-profile-ui",
            "Root Cause": "React infinite re-render loop triggered by a missing dependency array in a useEffect hook.",
            "What Worked": "Rolled back frontend deployment, Added empty dependency array to hook",
            "What Failed": "Clearing browser cache",
            "Lessons Learned": "useEffect hooks without dependency arrays will execute on every single render.",
            "Action Items / Prevention": "Enable exhaustive-deps eslint rule, Add CI block on lint warnings",
            "Resolution Steps": "Fixed hook deps, Redeployed"
        },
        {
            "Service / Component": "cart-api",
            "Root Cause": "N+1 query problem when calculating cart totals for users with many items.",
            "What Worked": "Refactored ORM call to use eager loading (.include()), Scaled DB vertically to survive peak",
            "What Failed": "Adding caching at the API level (cache invalidation too complex)",
            "Lessons Learned": "ORMs can easily hide inefficient database access patterns.",
            "Action Items / Prevention": "Add query logging in dev environment, Use DataLoaders for GraphQL resolvers",
            "Resolution Steps": "Added eager loading, Deployed hotfix"
        },
        {
            "Service / Component": "notification-worker",
            "Root Cause": "Memory leak caused by unclosed database connections inside a loop.",
            "What Worked": "Added finally block to close connections, Increased worker replica count",
            "What Failed": "Increasing heap size",
            "Lessons Learned": "Resources must always be explicitly released in background workers.",
            "Action Items / Prevention": "Use context managers (with statements) for all DB access, Add memory leak tests",
            "Resolution Steps": "Fixed connection closure, Redeployed"
        },
        {
            "Service / Component": "order-service",
            "Root Cause": "Race condition in order state machine allowed double-processing of payments.",
            "What Worked": "Added pessimistic locking to the order row during processing, Processed refunds",
            "What Failed": "Relying on frontend disabling the submit button",
            "Lessons Learned": "Distributed systems require database-level locking for critical state transitions.",
            "Action Items / Prevention": "Implement SELECT FOR UPDATE on payment processing, Add idempotency keys to Stripe",
            "Resolution Steps": "Added row locks, Refunded users"
        },
        {
            "Service / Component": "mobile-app",
            "Root Cause": "Uncaught exception in third-party analytics SDK crashed the app on startup for iOS 14 users.",
            "What Worked": "Disabled the feature flag for the analytics SDK, Pushed OTA update",
            "What Failed": "Waiting for Apple App Store expedited review",
            "Lessons Learned": "Third-party SDKs must always be wrapped in try/catch and gated behind feature flags.",
            "Action Items / Prevention": "Wrap SDK initialization, Expand automated testing to older OS versions",
            "Resolution Steps": "Disabled flag, Released OTA"
        }
    ],
    "Security": [
        {
            "Service / Component": "auth-gateway",
            "Root Cause": "API rate limiting bypassed by an attacker rotating through thousands of proxy IP addresses.",
            "What Worked": "Implemented device fingerprinting rate limits, Blocked known proxy ASNs",
            "What Failed": "Standard IP-based rate limiting",
            "Lessons Learned": "IP-based rate limiting is ineffective against distributed botnets.",
            "Action Items / Prevention": "Deploy Cloudflare Bot Management, Require CAPTCHA for suspicious logins",
            "Resolution Steps": "Updated WAF rules, Added CAPTCHA"
        },
        {
            "Service / Component": "s3-storage",
            "Root Cause": "Developer accidentally committed AWS access keys to a public GitHub repository.",
            "What Worked": "Instantly revoked the compromised keys via IAM, Rotated all related credentials",
            "What Failed": "Trying to scrub the git history",
            "Lessons Learned": "Secrets will eventually be leaked if humans are allowed to handle them directly.",
            "Action Items / Prevention": "Implement GitHub secret scanning, Move all deployments to IAM Roles/OIDC",
            "Resolution Steps": "Revoked keys, Rotated secrets"
        },
        {
            "Service / Component": "admin-panel",
            "Root Cause": "Cross-Site Scripting (XSS) vulnerability in user feedback form allowed session hijacking.",
            "What Worked": "Sanitized the input using DOMPurify, Invalidated all active admin sessions",
            "What Failed": "Attempting to write custom regex filters",
            "Lessons Learned": "Never trust user input, and never write custom HTML sanitization logic.",
            "Action Items / Prevention": "Enforce strict Content Security Policy (CSP), Audit all raw HTML renders",
            "Resolution Steps": "Sanitized input, Invalidated sessions"
        },
        {
            "Service / Component": "legacy-api",
            "Root Cause": "Unauthenticated endpoint exposed internal user PII due to missing middleware.",
            "What Worked": "Applied emergency auth middleware to all legacy routes, Purged CDN cache",
            "What Failed": "Checking access logs (too much volume)",
            "Lessons Learned": "Authentication must be global and opt-out, rather than opt-in per route.",
            "Action Items / Prevention": "Refactor router to apply global auth, Write automated unauthenticated access tests",
            "Resolution Steps": "Secured endpoint, Purged cache"
        },
        {
            "Service / Component": "ci-pipeline",
            "Root Cause": "Supply chain attack via a compromised npm package dependency.",
            "What Worked": "Pinned package to known safe version, Rebuilt and deployed application",
            "What Failed": "Running npm audit (did not catch zero-day)",
            "Lessons Learned": "Dependencies must be strictly pinned and audited for unexpected maintainer changes.",
            "Action Items / Prevention": "Implement Dependabot security gates, Setup internal artifact registry",
            "Resolution Steps": "Pinned version, Redeployed"
        }
    ]
}

output_lines = []
output_lines.append("# Contribute memory\n")

for stream_name, templates in streams.items():
    output_lines.append(f"\n### {stream_name} STREAM EXAMPLES ###\n")
    for i in range(20):
        t = templates[i % len(templates)]
        idx = i + 1
        output_lines.append(f"## Example {idx}")
        output_lines.append(f"Stream / Team: {stream_name}")
        # Make the service name slightly unique per iteration
        svc = t["Service / Component"] if i < 5 else f"{t['Service / Component']}-v{i//5+1}"
        output_lines.append(f"Service / Component: {svc}")
        output_lines.append(f"Root Cause: {t['Root Cause']}")
        output_lines.append(f"What Worked: {t['What Worked']}")
        output_lines.append(f"What Failed: {t['What Failed']}")
        output_lines.append(f"Lessons Learned: {t['Lessons Learned']}")
        output_lines.append(f"Action Items / Prevention: {t['Action Items / Prevention']}")
        output_lines.append(f"Resolution Steps: {t['Resolution Steps']}")
        output_lines.append("")

with open('add_post.txt', 'w') as f:
    f.write('\n'.join(output_lines))

print("Successfully generated add_post.txt")
