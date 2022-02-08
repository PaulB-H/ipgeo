<p>On hold...</p>
<p>I started this without maybe a clear enough direction or understanding of what I needed to do. At this point I think it will be easier to start fresh than try and rebuild this /shrug</p>

<h1>IP Geo + Analytics</h1>

<img src="https://raw.githubusercontent.com/PaulB-H/ipgeo/main/readme_images/ipgeo.png" />

<h5>HTML, CSS, JS, Node.JS</h5>

<p>
  <strike><a href="#">
    Live site link
    </a></strike>
  <br />
  <sup><small>Not up yet! - Work in Progress!</small></sup>
</p>

<h2>Description</h2>
<p>Creating my own analytic system, with server-side IP geo-location</p>

<h2>Details</h2>

<p>**Currently I am only logging information based off of request IP address, which will not give accurate data when multiple people are on one network. I should be able to easily add a token || cookie client side on session start to identify users on the same network, or use a lib like express-session for this.</p>

<h4>Rough Version</h4>
<img src="https://raw.githubusercontent.com/PaulB-H/ipgeo/main/readme_images/rough.PNG" />

<h4>Current progress</h4>
<img src="https://raw.githubusercontent.com/PaulB-H/ipgeo/main/readme_images/progress.PNG" />

<h4>Example of startup logging where a backup file was found with data from a previous day</h4>
<img src="https://raw.githubusercontent.com/PaulB-H/ipgeo/main/readme_images/startup.PNG" />

<p>More to come...</p>

<h2>Libraries / Frameworks / Packages</h2>
<ul>
<li><a href="https://www.npmjs.com/package/cron" target="_blank">cron</a></li>
<li><a href="https://www.npmjs.com/package/express" target="_blank">express</a></li>
<li><a href="https://www.npmjs.com/package/request-ip" target="_blank">request-ip</a></li>
<li><a href="https://www.npmjs.com/package/express-useragent" target="_blank">express-useragent</a></li>
<li><a href="https://www.npmjs.com/package/express-slow-down" target="_blank">express-slow-down</a></li>
<li><a href="https://www.npmjs.com/package/@maxmind/geoip2-node" target="_blank">@maxmind/geoip2-node</a></li>
</ul>
