                                                                                                
  1. Start by understanding what you're building                                                                                                                                                  
                                                                                                                                                                                                  
  Before writing code, make sure you can explain the goal in your own words. For the migration runner: "I need a script that reads SQL files from a folder, checks which ones have already been
  applied by looking at a database table, and runs the new ones."                                                                                                                                 
                  
  If you can say that clearly, you're ready to start. If not, re-read the checklist step or ask me to clarify.

  2. Break it into tiny pieces yourself

  The checklist gives you the what. Your job is to figure out the how, piece by piece. For the migration runner, that might be:

  1. How do I read files from a directory in Node.js?
  2. How do I run a raw SQL query with pg?
  3. How do I create a table if it doesn't exist?
  4. How do I run multiple queries in a transaction?

  Each of those is a small, googleable question.

  3. The actual workflow for each piece

  Try first (5-10 min). Write what you think the code should look like, even if you're guessing. This forces your brain to engage with the problem before looking at answers.

  Google for specific questions. "Node.js read files from directory", "pg pool transaction example." Skim the docs or a Stack Overflow answer, then go back to your code and apply it. Don't
  copy-paste — type it yourself.

  Use me for:
  - Explaining concepts you don't get after googling ("what does BEGIN/COMMIT actually do?")
  - Reviewing code you've written ("does this migration runner look right?")
  - Debugging when you're stuck for 20+ minutes and can't figure out why something doesn't work
  - Architecture questions ("should I structure it this way or that way?")

  Don't use me for:
  - Writing the code for you — you'll learn much less
  - Things you could figure out by reading an error message carefully

  4. The 30-minute rule

  If you're stuck on something for more than 30 minutes with no progress, stop and ask — me, Google, whatever. Spinning your wheels teaches frustration, not programming. But do give yourself
  those first 30 minutes, because the struggle is where the learning happens.

  In short

  You drive, I navigate. Write the code, make the decisions, hit the walls. Come to me when you need a concept explained, a design reviewed, or a bug you can't crack. That's the balance between
  learning and making progress.