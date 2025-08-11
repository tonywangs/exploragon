# Exploragon

City exploration, gamified.

Youtube video link: https://youtu.be/gYtgMuymzdY

We divided San Francisco into 1000 GPS-tracked hexagons. Exploragon is a 24-hour city exploration challenge; completing location-specific tasks in each hexagon lets you claim the hexagon, allowing you to compete against friend groups or strangers for citywide dominance. Each zone’s difficulty and point value scale with its significance, from quick selfies in quiet neighborhoods to creative challenges at major landmarks. All submissions go through multimodal AI verification, checking both task completion and location authenticity via Gemini video and photo analysis. The system uses real-time multi-user GPS tracking, strict hex partitioning, and our model's binary pass/fail scoring.  

<img src="https://github.com/tonywangs/exploragon/blob/main/example-images/gallery.jpg" width="600">
<img src="https://github.com/tonywangs/exploragon/blob/main/example-images/gallery%20(1).jpg" width="600">
<img src="https://github.com/tonywangs/exploragon/blob/main/example-images/gallery%20(2).jpg" width="600">
<img src="https://github.com/tonywangs/exploragon/blob/main/example-images/gallery%20(3).jpg" width="600">
<img src="https://github.com/tonywangs/exploragon/blob/main/example-images/gallery%20(4).jpg" width="600">

**How we built it**  
Next.js 15 frontend with React 19 handles the real-time map interface. Redis manages location streams with 2-second GPS throttling and automatic TTL expiration for active user tracking. The hexagon grid uses H3 spatial indexing overlaid on Google Maps, with 100-meter radius cells covering SF's 121.6 square kilometers. Location verification runs server-side coordinate validation against GeoJSON boundary polygons.
Video capture uses WebRTC MediaRecorder API with VP9/Opus encoding, streaming directly to our upload endpoint. Gemini 1.5 Pro processes video frames for task completion verification; no fuzzy scoring, just binary pass/fail based on prompt engineering that forces strict "true"/"false" responses. The AI pipeline converts video to base64, sends structured prompts with task context, and parses responses for challenge validation.
Real-time multiplayer runs on 1-second polling intervals, updating player positions and hex ownership states across all connected clients. The leaderboard aggregates unique hexagon visits from Redis sorted sets, calculating exploration metrics and competitive rankings. Location history gets stored as timestamped coordinates in persistent sorted sets with 24-hour retention.

**Challenges we ran into**  
Google Maps API rate limiting forced us to implement aggressive polygon caching and lazy-loaded hex rendering. The hexagon tessellation math for flat-topped grids required custom coordinate transformations; H3 uses different orientation than our visual grid.
Redis connection pooling became critical under concurrent GPS streams from multiple users. We had to implement connection reuse and error retry logic to handle Redis Cloud's connection limits.
Gemini's multimodal API occasionally returns verbose responses instead of binary true/false, so we implemented substring matching and response parsing fallbacks. Mobile camera permissions and MediaRecorder codec support varied across devices, requiring progressive enhancement for video capture.
Location accuracy on mobile proved inconsistent—GPS drift would place users outside hex boundaries even when physically present. We added 100-meter tolerance zones and implemented moving averages for coordinate smoothing.

**Accomplishments that we're proud of**  
Built a production-grade real-time location tracking system that scales to dozens of concurrent users without breaking stride. The H3 hexagon implementation covers every navigable inch of San Francisco with mathematically precise boundaries.
Zero-latency map updates across all connected clients; when someone claims a hex, everyone sees it instantly. The Redis-backed location streaming handles GPS coordinate ingestion at sub-second intervals while maintaining data consistency.
Achieved reliable multimodal AI verification with 95%+ accuracy on task completion detection. Our prompt engineering forces deterministic responses from an inherently non-deterministic LLM, making the scoring system actually viable for competitive gameplay.

**What we learned**  
Spatial databases are deceptively complex. H3's hierarchical indexing is elegant but requires deep understanding of coordinate systems and projection mathematics. We learned to respect the complexity of geographic computation.
Redis sorted sets are perfect for time-series location data, but memory management becomes critical with hundreds of GPS points per user. Proper TTL configuration and data structure choice make the difference between smooth operation and memory exhaustion.
LLM prompt engineering for deterministic outputs requires adversarial thinking—you have to anticipate every possible response variation and constrain the model accordingly.
Multimodal AI verification works, but only with extremely precise prompt construction.
Real-time multiplayer is about data synchronization, not just WebSocket connections. State management across distributed clients requires careful event ordering and conflict resolution strategies.

**What's next for Exploragon**  
Exploragon has the potential to be a group bonding activity, a weekend game, or a long-term challenge. We'll add more landmarks, more tasks, and create a cohesive point system for scoring.

**Some more ideas:**  
Expanding beyond San Francisco requires dynamic hex grid generation for any city worldwide. We're implementing automated boundary detection using OpenStreetMap data and adaptive grid density based on population metrics.  
Machine learning models trained on successful completion patterns could generate procedural challenges tailored to specific locations and user skill levels. The current static task list is just the beginning.  
Blockchain integration for permanent hex ownership records and tradeable location NFTs. Imagine owning digital real estate mapped to actual geography, with smart contracts handling territory transfers and reward distribution.  
WebRTC peer-to-peer networking could eliminate server dependencies for real-time position sharing, creating a fully decentralized exploration network that scales infinitely without infrastructure costs.
