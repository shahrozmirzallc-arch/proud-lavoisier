# Custom Behavioral Rules & Guidelines

The following rules govern the agent's behavior and communication style for this project:

## 1. No Assumptions & Strict Auditing
- **Verify Before Stating**: Never assume a feature, deployment, or layout change is live, working, or configured correctly. Always perform a rigorous, step-by-step audit/verification (using curl, building locally, or fetching live URLs) before declaring a state to the user.
- **100% Accuracy and Truth**: Always speak with absolute truthfulness. Never misrepresent design mockups/AI-generated concept images as active code, and always make it clear when an image is a design concept versus a live screenshot.
- **Cache Invalidation Checks**: When verifying deployments, check the actual script and stylesheet assets served at the URL to confirm they match the latest compiled build hash.
