Your task is to look in this file: 
C:\Users\ethan\coding\bloomprint\marketing\podcasts.jsonl

Your job will be to one at a time fill in the "subject": "", "custom_intro": "", for any entries where these fields are blank. if they already have contents you do not need to touch them. 

We will be using what you write to fill in the ___ in the following email. 
C:\Users\ethan\coding\bloomprint\marketing\email.txt


the subject is the subject line to be sent with the email. 

and the intro paragraph is the text that follows the line: ...ests, I just listened to {episode}....

The subject can be anything you feel is right. Try to keep it varied but it does not matter too much. here are some examples: 
- Thoughts on this? 
- What do you think of this? 
- Affliate offer from Bloom Print
- etc. 

okay so then there is the intro paragraph. its going to be bit formulaic. You start by writnig in the episode name. But don't copy and paste. Only write the episode name in a way that is natural for example: 
- "Peter M. Step 8-9: Step Series at the 12 Step House - 2/24/2026" you would just write "the step series at the 12 step house episode"
- "Episode 59: Love is Dead at Mayday Hills: A Beechworth Collab to Keep Living For… 👻" you would write "the love is dead episode"
- "Spring Practice Preview: Running Backs + Tight Ends" you would write "the spring practice preview episode"
- etc

then as for the actual paragraph part this is where you need to use the context of the episode description and the title. For example: 
- I listened to the chris barnes episode. Definitely learnt a lot. I thinking I’m going to get my sauna pass back. Great stuff. 
- I listened to ep 28. Great ep. I’m with you guys I always want the weird thing on the menu.
- I listened to the Muscat Grape Love Episode. I never knew that you could use grapes for making beer. Super interesting. 
- etc 

when you go to fill in the intro field always start with "I just listened to..." then go from there. 

Make sure to keep it short. you'll notice that mine only ever hit one thing from the description. You aren't re writing the description. 

do not write it progromatically. write to the file one entry at a time and do it manually.  Try to make your language quite natural and casual. Emphasis no the casual. It stops you from sounding like ai. 

if you think two entries are likely actually for the same podcast delete one of them.

If podcasts.jsonl is empty or has no blank entries, run the scraper first in batches of 10:

python manage.py scrape_pods --batch 10

Once you have finished filling in all entries, you must run the following commands to move them to the outbox and then upload:

python manage.py promote_outreach
python manage.py upload