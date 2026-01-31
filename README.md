You can also deploy NautilusOS in a Github Codespace:

1. click on the green code button in this repo
2. click on the codespaces tab
3. create a new codespace by clicking the "Create codespace on main" button
4. navagate to the terminal near the bottom and run `python3 -m http.server 8080`
5. click the "Make Public" option in the popup that shows up, or go to the Ports tab, right click on 8080, hover on "Port Visiblity" and click "Public"
6. click on the Forwarded Address in the Ports tab. it should look something like `https://<your-repo-name>-<random-id>.<your-username>.github.dev`
7. boom! use your temorary link for its full 30 minute lifetime!
8. to change the port, just run `python3 -m http.server <your port number>`

*To extend the life of your codespace link visit your profile settings, go to the Codespaces tab, and change the "Default idle timeout" time from 30 minutes to 240 minutes, which is the maximum time.


Basically... a whole little OS in your browser :D

---

## 🚧 todos (devs view dev discord for more)

- [x] fix bug where the downlaoad onefile button in the quick menu didnt actually fownload, it just opened the raw github link
- [ ] automaqitcally lower the margin bottom on desktop icons when switching to small icons and large icons. for medium and extra large it just looks fine idk
- [x] EDIT ALL THEMES TO MATCH DARK THEME. A BUCN HFO VISUAL BUGS I ONLY FIXED IN DARK (oops)
- [x] the right lcick menu doesnt go away after u click on an option or lcick off it??? when did this happen :sob: (but only sometimes???) (what?????)
- [ ] add swimmign fishes in setup screen from NautilusOS-Web insted of odd flaoting orbs (lane)
- [x] add empty favicon and name (i saw this somewhere it was neat)
- [x] change stealth master achievment to work for any cloaking function not jsut basic cloak 
- [ ] add pfps from github to contributers and devs in about app
- [ ] fix light theme gosh it sucks
- [x] fix bug where cancel delete screenshot in photos app doesnt work and it just deletes it
- [x] very minor visual bugs (full width taskbar move desktop icon container down, some other junk)
- [ ] fix bug where if too many apps are open it randomly flashes black
- [ ] if u hit login in without choosing an existing accoutnit just picks the first one, should ask u to pick an acc
- [ ] Add an option to increase or decrease window transparency 
- [ ] Window animation settings
- [x] add option to cloak on clickpoff in basic cloaking
- [ ] Make music player search and download via spotify (maybe use the recent annas archive spotify leak?)
- [ ] Add a scramjet proxy (xor)
- [ ] Add illustrations already in css to js for apps and games. themes already added
- [ ] add option to upload custom image to tab blackout for monitering extensions
- [x] add option to do a panic image instead of a panic redirect
- [ ] add default coverup option in cloaking, chrome unsafe pages, page failed to load etc
- [x] add achivement for opening bootloader (Power User)
- [ ] add documentation in help for all apps (community as well) and update whats new carosel
- [x] add option to chaneg desktop icon size in settings
- [x] a lot of apps dont appear in the start menu (??)
- [ ] add noodlelover to contributers in about app!!!

*Completed tasks remain visible for ~24 hours before being manully cleared.*

---

## 🌐 domain ideas

- `nautilusos.app` $14.20/year at cloudflare or
- `nautilusos.me` $2.99/first year at dreamhost
- `nautliusos.xyz` $2.00/year at namecheap (some 90% off deal)
- `nautiluson.top` $4.63/year at porkbun
  
Feel like donating? We accept Monero (XMR)!

<img width="219" height="220" alt="image" src="https://github.com/user-attachments/assets/01f175ca-dfa5-4625-9483-71621fe4dcdc" />


---

## 🖼 screenshots (this is like 5% of the entire project, check it out to see it all yourself!!)

<img width="1918" height="897" alt="image" src="https://github.com/user-attachments/assets/c8911ec5-7748-4287-ba48-4370a44608be" />
<img width="1917" height="906" alt="image" src="https://github.com/user-attachments/assets/8d853477-0fb4-45f1-a3cb-3e88169eb765" />
<img width="1918" height="871" alt="image" src="https://github.com/user-attachments/assets/40f6ad60-ff23-4e26-9772-7aac5746bddf" />
<img width="1918" height="906" alt="image" src="https://github.com/user-attachments/assets/13b106be-49c5-416f-bf01-b5915491eb88" />
<img width="1916" height="912" alt="image" src="https://github.com/user-attachments/assets/633fd5c8-ba2e-4e95-b6b7-71c8e6cf0d4b" />
<img width="1916" height="908" alt="image" src="https://github.com/user-attachments/assets/26fec667-6acf-4dc5-bd43-be6872560482" />
<img width="1918" height="911" alt="image" src="https://github.com/user-attachments/assets/b042fbf3-fd80-4b53-9a1f-bc62da8e6424" />
<img width="1918" height="916" alt="image" src="https://github.com/user-attachments/assets/b72f59ce-22da-458e-b6ef-c340288edfce" />

---

## 💡 more about

This is mostly just a fun UI sandbox with no backend or external data storage. It just seemed like the logical next step after Helios Browser.  
Everything runs client-side.  
Built with just HTML, CSS, and JS (no frameworks, no CDNs except icons/fonts)

---

## 🧠 try it

Open the NautilusOS-OneFile/index.html file in your browser. That’s it. 

---

## 🧩 credits

Developed by dinguschan, x8rr, and lanefiedler-731

## IF YOU ARE FORKING
**License compliance notice (AGPL-3.0 §5):**
If you fork or redistribute NautilusOS, you must:
 - Keep our copyright & license files intact.
 - Add a **prominent** “Modified from NautilusOS” notice with the date of your change.
 - Provide full source to any users over a network.
 Non-compliant forks will be reported under GitHub’s DMCA policy.
