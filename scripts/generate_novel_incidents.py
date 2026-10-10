import random

streams = {
    "SRE": [
        {
            "Service": "dns-resolver",
            "Symptoms / Error": "SERVFAIL on internal domains",
            "Description": "Internal microservices cannot resolve core-database.internal, causing cascading network timeouts.",
            "Root Cause": "Upstream CoreDNS pods ran out of memory and entered CrashLoopBackOff.",
            "What Worked": "Increased memory limits on CoreDNS DaemonSet, Restarted pods",
            "What Failed": "Flushing local node DNS caches",
            "Lesson Learned": "DNS infrastructure needs significant resource headroom, especially during scale-up events.",
            "Prevention": "Implement NodeLocal DNSCache, Alert on CoreDNS memory usage > 70%"
        },
        {
            "Service": "cdn-router",
            "Symptoms / Error": "504 Gateway Timeouts globally",
            "Description": "Edge nodes in EU and US-East are failing to route traffic back to the origin load balancer.",
            "Root Cause": "BGP route leak caused origin traffic to be blackholed by an intermediary ISP.",
            "What Worked": "Shifted traffic to secondary origin IP via Route53, Opened ticket with ISP",
            "What Failed": "Clearing CDN edge caches",
            "Lesson Learned": "Global services must have redundant origin IPs mapped to completely different transit providers.",
            "Prevention": "Deploy multi-transit origin architecture, Implement synthetic BGP route monitoring"
        },
        {
            "Service": "bgp-announcer",
            "Symptoms / Error": "Route flapping detected",
            "Description": "Datacenter routing tables are fluctuating every 30 seconds, leading to severe packet loss.",
            "Root Cause": "Faulty transceiver module on the primary spine switch caused link state to bounce rapidly.",
            "What Worked": "Administratively downed the flapping interface, Replaced SFP module",
            "What Failed": "Resetting the BGP session softly",
            "Lesson Learned": "Hardware faults can manifest as logical routing loops if dampening is not aggressively configured.",
            "Prevention": "Enable aggressive BGP route dampening on all spine links, Setup optical power level alerts"
        },
        {
            "Service": "vpn-gateway",
            "Symptoms / Error": "IKE phase 1 negotiation failed",
            "Description": "Remote engineering staff cannot connect to the internal production VPC.",
            "Root Cause": "IPsec pre-shared key was accidentally rotated by an automated script on only one side of the tunnel.",
            "What Worked": "Restored previous PSK from Secrets Manager manually",
            "What Failed": "Rebooting the VPN gateway instances",
            "Lesson Learned": "Key rotations on established IPSec tunnels must be carefully orchestrated with overlap windows.",
            "Prevention": "Use certificate-based authentication instead of PSKs, Implement dry-run for rotation scripts"
        },
        {
            "Service": "core-switch",
            "Symptoms / Error": "High CRC errors on trunk port",
            "Description": "Physical layer degradation causing 20% packet drops between primary database racks.",
            "Root Cause": "A severely bent fiber optic cable was causing massive light refraction under load.",
            "What Worked": "Failed over to redundant fiber pair, Replaced damaged cable",
            "What Failed": "Clearing interface counters",
            "Lesson Learned": "Physical cabling in high-traffic paths must be rigorously protected and monitored for signal degradation.",
            "Prevention": "Audit cable routing in core racks, Add SNMP trap for CRC error rate > 10/sec"
        }
    ],
    "DevOps": [
        {
            "Service": "artifact-registry",
            "Symptoms / Error": "403 Forbidden on pull",
            "Description": "Kubernetes nodes are suddenly failing to pull docker images due to an expired registry token.",
            "Root Cause": "The service account token used by the kubelet image puller expired after 1 year.",
            "What Worked": "Generated new long-lived token and updated imagePullSecrets, Restarted failed pods",
            "What Failed": "Redeploying applications",
            "Lesson Learned": "Static tokens are a ticking time bomb and will always cause an incident exactly when you forget about them.",
            "Prevention": "Migrate to OIDC/IAM roles for service accounts, Alert on token expiration 30 days out"
        },
        {
            "Service": "vault-cluster",
            "Symptoms / Error": "Vault is sealed",
            "Description": "HashiCorp Vault nodes rebooted and came up in a sealed state, taking down all secret retrieval.",
            "Root Cause": "Unplanned EC2 host maintenance rebooted Vault instances which lacked auto-unseal configuration.",
            "What Worked": "Gathered quorum of keyholders to manually unseal Vault via CLI",
            "What Failed": "Waiting for Vault to recover automatically",
            "Lesson Learned": "Production Vault clusters must use KMS auto-unseal to survive node reboots.",
            "Prevention": "Configure AWS KMS auto-unseal, Create runbook for emergency manual unseal"
        },
        {
            "Service": "fluentd-aggregator",
            "Symptoms / Error": "Buffer queue full",
            "Description": "Log aggregation buffers are completely full because Elasticsearch is rejecting bulk inserts.",
            "Root Cause": "Elasticsearch cluster reached 90% disk watermark and flipped all indices to read-only.",
            "What Worked": "Deleted old indices to free space, Manually removed read_only_allow_delete block",
            "What Failed": "Restarting fluentd pods (just caused data loss)",
            "Lesson Learned": "Log aggregation agents must be configured with backpressure handling or file buffers.",
            "Prevention": "Update ILM policy to delete logs > 7 days, Configure file-backed buffering in fluentd"
        },
        {
            "Service": "sonarqube-server",
            "Symptoms / Error": "OutOfMemoryError in Java",
            "Description": "Code quality scanning service crashed while analyzing a massive monorepo PR.",
            "Root Cause": "The PR contained generated files (100MB+) that SonarQube attempted to parse in-memory.",
            "What Worked": "Increased JVM heap size to 8GB, Added generated files to sonar.exclusions",
            "What Failed": "Re-triggering the CI job",
            "Lesson Learned": "Static analysis tools must exclude autogenerated code to prevent memory exhaustion.",
            "Prevention": "Enforce strict sonar.exclusions for vendor/generated paths, Monitor JVM heap usage"
        },
        {
            "Service": "spinnaker-deploy",
            "Symptoms / Error": "Orphaned bake pipelines",
            "Description": "Deployment pipelines are stuck indefinitely in the 'Bake AMI' stage without timing out.",
            "Root Cause": "Packer process hung on an interactive prompt during apt-get upgrade.",
            "What Worked": "Killed hung packer processes, Added DEBIAN_FRONTEND=noninteractive to bake scripts",
            "What Failed": "Canceling the pipeline via UI (zombie processes remained)",
            "Lesson Learned": "All CI/CD shell commands must be strictly non-interactive.",
            "Prevention": "Enforce noninteractive flags in all build scripts, Implement hard timeouts on bake stages"
        }
    ],
    "Software Engineering": [
        {
            "Service": "recommendation-engine",
            "Symptoms / Error": "NaN returned in ML predictions",
            "Description": "The machine learning model is suddenly returning NaN for all user product recommendations.",
            "Root Cause": "A division by zero occurred during feature normalization because a new product had exactly 0 views.",
            "What Worked": "Added epsilon (small constant) to denominator in normalization function, Redeployed model",
            "What Failed": "Reverting the model weights",
            "Lesson Learned": "Mathematical operations in data pipelines must always account for zero values.",
            "Prevention": "Implement property-based testing for edge case inputs, Add data validation layers before inference"
        },
        {
            "Service": "pdf-generator",
            "Symptoms / Error": "Chrome headless zombie processes",
            "Description": "Puppeteer instances are not being closed, leading to server CPU locking at 100%.",
            "Root Cause": "An unhandled promise rejection in the PDF generation logic caused the browser.close() block to be skipped.",
            "What Worked": "Added try/finally blocks to ensure browser closes, Killed zombie processes manually",
            "What Failed": "Increasing server CPU limits",
            "Lesson Learned": "External process management in Node.js requires absolute cleanup guarantees (try/finally).",
            "Prevention": "Use browserless.io or dedicated pool managers instead of raw Puppeteer, Implement process lifecycle tests"
        },
        {
            "Service": "image-processor",
            "Symptoms / Error": "Corrupt EXIF data crash",
            "Description": "A specific user-uploaded image is causing a segfault in the underlying C++ ImageMagick binding.",
            "Root Cause": "A maliciously crafted image header exploited an older ImageMagick parsing vulnerability.",
            "What Worked": "Disabled EXIF parsing temporarily, Upgraded ImageMagick library",
            "What Failed": "Attempting to delete the file via the API (API crashed)",
            "Lesson Learned": "C/C++ bindings for media processing are highly susceptible to memory corruption from bad inputs.",
            "Prevention": "Run media processing in strictly sandboxed environments (e.g., gVisor or lambdas), Keep ImageMagick updated"
        },
        {
            "Service": "fraud-detection-api",
            "Symptoms / Error": "Timeout connecting to ML endpoint",
            "Description": "The API that blocks fraudulent transactions is timing out, causing legitimate payments to be held.",
            "Root Cause": "The internal ML endpoint was overwhelmed by a spike in traffic and lacked a circuit breaker.",
            "What Worked": "Implemented a circuit breaker to fail open (allow transactions), Scaled ML replicas",
            "What Failed": "Restarting the API pods",
            "Lesson Learned": "Critical path synchronous ML checks must have strict timeouts and fallback mechanisms.",
            "Prevention": "Implement Hystrix/Resilience4j circuit breakers, Tune read timeouts to 200ms"
        },
        {
            "Service": "chat-websocket",
            "Symptoms / Error": "Too many open files",
            "Description": "Websocket server reached the OS file descriptor limit, dropping all new chat connections.",
            "Root Cause": "Linux ulimit -n was set to the default 1024, but concurrent users spiked to 5000.",
            "What Worked": "Updated limits.conf to 65535, Restarted websocket process",
            "What Failed": "Scaling horizontally (didn't fix existing nodes)",
            "Lesson Learned": "High-concurrency services must tune OS-level limits, not just application limits.",
            "Prevention": "Update Dockerfile to raise ulimit, Add Datadog monitor for open file descriptors"
        }
    ],
    "Security": [
        {
            "Service": "waf-edge",
            "Symptoms / Error": "False positive blocking (403)",
            "Description": "A new WAF rule is aggressively blocking legitimate API traffic as SQL injection.",
            "Root Cause": "The WAF regex rule for detecting SQLi inadvertently matched a standard UUID pattern in the URL.",
            "What Worked": "Rolled back the WAF rule change, Bypassed WAF for the specific UUID endpoint temporarily",
            "What Failed": "Asking users to retry their requests",
            "Lesson Learned": "WAF rules must always be deployed in 'log-only' mode before being enforced.",
            "Prevention": "Mandate 24-hour log-only period for new WAF rules, Improve regex specificity"
        },
        {
            "Service": "iam-authenticator",
            "Symptoms / Error": "SAML assertion expired",
            "Description": "SSO integration is failing because the IDP signing certificate was not rotated.",
            "Root Cause": "The Okta IdP certificate expired and the automated rotation script failed silently last month.",
            "What Worked": "Manually uploaded the new certificate to the SP config, Restarted auth services",
            "What Failed": "Clearing user cookies",
            "Lesson Learned": "Silent failures in automated rotation scripts are more dangerous than not having automation.",
            "Prevention": "Add explicit alerting on rotation script failures, Monitor certificate expiry directly via prometheus exporter"
        },
        {
            "Service": "vulnerability-scanner",
            "Symptoms / Error": "Scanner blocked by firewall",
            "Description": "Internal vulnerability scans are failing because they are being dropped by the zero-trust mesh.",
            "Root Cause": "The security scanning subnet was not added to the new Istio AuthorizationPolicy allowlist.",
            "What Worked": "Updated the AuthorizationPolicy to allow traffic from the scanner CIDR block",
            "What Failed": "Restarting the scanner agents",
            "Lesson Learned": "Zero-trust environments require security tooling to be explicitly permitted like any other service.",
            "Prevention": "Add scanner CIDR to global base policy templates, Test scans in staging before prod mesh rollouts"
        },
        {
            "Service": "bastion-host",
            "Symptoms / Error": "SSH brute force detected",
            "Description": "Unusual volume of SSH connection attempts originating from an unknown ASN targeting the bastion.",
            "Root Cause": "A new zero-day in OpenSSH resulted in widespread scanning; attackers found our public IP.",
            "What Worked": "Blocked the attacking ASN at the network firewall, Implemented fail2ban rules",
            "What Failed": "Rotating SSH keys (didn't stop the scanning volume)",
            "Lesson Learned": "Bastion hosts should never be completely open to the internet, even with key-based authentication.",
            "Prevention": "Restrict bastion access to corporate VPN IP blocks, Enforce MFA on SSH"
        },
        {
            "Service": "audit-logger",
            "Symptoms / Error": "Write capacity exceeded",
            "Description": "Compliance audit logs are being dropped because the DynamoDB table reached its provisioned write capacity.",
            "Root Cause": "A rogue script generated millions of audit events in a loop, overwhelming the static provisioned capacity.",
            "What Worked": "Switched DynamoDB table to On-Demand billing mode instantly, Killed the rogue script",
            "What Failed": "Gradually scaling up provisioned capacity (too slow)",
            "Lesson Learned": "Critical compliance data streams should use On-Demand capacity or SQS buffering to handle spikes.",
            "Prevention": "Place SQS queue in front of DynamoDB for audit logs, Implement rate limiting per actor"
        }
    ]
}

output_lines = []
output_lines.append("# Novel Active Incident Scenarios (Zero Historical Data)\n")

for stream_name, templates in streams.items():
    output_lines.append(f"\n### {stream_name} STREAM EXAMPLES ###\n")
    for i in range(100):
        t = templates[i % len(templates)]
        idx = i + 1
        output_lines.append(f"## Example {idx} ({stream_name})")
        
        # slight variations for uniqueness
        service = t["Service"] if i < 5 else f"{t['Service']}-{random.choice(['alpha', 'beta', 'v3', 'external', 'internal'])}"
        
        severity = random.choice(["SEV-1", "SEV-2", "SEV-3"])
        error_rate = f"{random.uniform(5.0, 99.0):.1f}%"
        db_utilization = f"{random.randint(5, 95)}%"
        recent_deployment = random.choice(["Yes", "No"])
        deployment_time = f"{random.randint(1, 24)} hours ago" if recent_deployment == "Yes" else "N/A"
        
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

with open('new123_data_4.txt', 'w') as f:
    f.write('\n'.join(output_lines))

print("Successfully generated new123_data_4.txt with Resolution fields.")
