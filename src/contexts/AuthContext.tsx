"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// Users with hashed PINs (simple hash for demo - in production use bcrypt)
// Brendan: 400107, Chris: 847291, Gabe: 562830
const USERS = [
  { id: 1, name: "Brendan Conn", email: "brendan@arrowfund.co", pinHash: "a400107z" },
  { id: 2, name: "Chris Clifford", email: "chris@arrowfund.co", pinHash: "a847291z" },
  { id: 3, name: "Gabriel Borden", email: "gabe@arrowfund.co", pinHash: "a562830z" },
];

const LOCKOUT_KEY = "arrow_lockout";
const SESSION_KEY = "arrow_session";
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Dark humor for alternative messaging mode
const JOKES = [
  { text: "I have a fish that can breakdance. Only for 20 seconds though, and only once.", author: "Dark" },
  { text: "My grandfather has the heart of a lion and a lifetime ban from the zoo.", author: "Dark" },
  { text: "I wasn't close to my father when he died. Which is lucky because he stepped on a landmine.", author: "Dark" },
  { text: "My wife and I have decided we don't want children. If anybody does, please just send us your contact details and we can drop them off tomorrow.", author: "Dark" },
  { text: "I visited my friend at his new house. He told me to make myself at home. So I threw him out. I hate having visitors.", author: "Dark" },
  { text: "The doctor gave me one year to live, so I shot him. The judge gave me 15 years.", author: "Dark" },
  { text: "My boss told me to have a good day. So I went home.", author: "Dark" },
  { text: "I threw a boomerang a few years ago. I now live in constant fear.", author: "Dark" },
  { text: "My wife told me she'll slam my head on the keyboard if I don't get off the computer. I'm not too worried, I think she's jokinglkjhfakljn m]LNZ.LทVNKB.", author: "Dark" },
  { text: "I have a stepladder because my real ladder left when I was a kid.", author: "Dark" },
  { text: "My therapist says I have a preoccupation with vengeance. We'll see about that.", author: "Dark" },
  { text: "I told my psychiatrist I've been hearing voices. He told me I don't have a psychiatrist.", author: "Dark" },
  { text: "My parents raised me as an only child, which really annoyed my younger brother.", author: "Dark" },
  { text: "I don't have a carbon footprint. I just drive everywhere.", author: "Dark" },
  { text: "I childproofed my house but the kids still get in.", author: "Dark" },
  { text: "The cemetery is so crowded. People are dying to get in.", author: "Dark" },
  { text: "My wife said I should do lunges to stay in shape. That would be a big step forward.", author: "Dark" },
  { text: "I asked my date to meet me at the gym but she never showed up. I guess the two of us aren't going to work out.", author: "Dark" },
  { text: "I used to think I was indecisive. But now I'm not so sure.", author: "Dark" },
  { text: "I'm not saying I hate you, but I would unplug your life support to charge my phone.", author: "Dark" },
  { text: "My favorite exercise is a cross between a lunge and a crunch. I call it lunch.", author: "Dark" },
  { text: "They say don't go grocery shopping when you're hungry. But it's been a week and I just keep getting hungrier.", author: "Dark" },
  { text: "I have an inferiority complex but it's not a very good one.", author: "Dark" },
  { text: "The problem with kleptomaniacs is that they always take things literally.", author: "Dark" },
  { text: "I'm reading a horror story in braille. Something bad is going to happen, I can feel it.", author: "Dark" },
  { text: "My grief counselor died the other day. He was so good at his job, I don't even care.", author: "Dark" },
  { text: "I just got my doctor's test results and I'm really upset. Turns out I'm not gonna be a doctor.", author: "Dark" },
  { text: "I told my wife she was drawing her eyebrows too high. She looked surprised.", author: "Dark" },
  { text: "A man walks into a library and asks for books about paranoia. The librarian whispers, 'They're right behind you.'", author: "Dark" },
  { text: "I have a joke about trickle-down economics. But 99% of you will never get it.", author: "Dark" },
  { text: "Life is like a box of chocolates. It doesn't last as long for fat people.", author: "Dark" },
  { text: "When I see the names of lovers engraved on a tree, I don't find it cute. I find it weird how many people take knives on dates.", author: "Dark" },
  { text: "My ex got hit by a bus. I lost my job as a bus driver.", author: "Dark" },
  { text: "Where did Joe go after getting lost in a minefield? Everywhere.", author: "Dark" },
  { text: "What's the difference between me and cancer? My dad didn't beat cancer.", author: "Dark" },
  { text: "I'd tell you a chemistry joke but I know I wouldn't get a reaction.", author: "Dark" },
  { text: "I have many jokes about unemployed people. Sadly, none of them work.", author: "Dark" },
  { text: "My wife left a note on the fridge saying 'This isn't working.' I don't know what she's talking about. The fridge is working fine.", author: "Dark" },
  { text: "I was raised as an only child, which really annoyed my sister.", author: "Dark" },
  { text: "I have a joke about procrastination but I'll tell you later.", author: "Dark" },
  { text: "Money talks. Mine just says goodbye.", author: "Dark" },
  { text: "I was going to tell a joke about time travel, but you guys didn't like it.", author: "Dark" },
  { text: "Build a man a fire, and he'll be warm for a day. Set a man on fire, and he'll be warm for the rest of his life.", author: "Dark" },
  { text: "Give a man a plane ticket and he flies for the day. Push him out of the plane and he flies for the rest of his life.", author: "Dark" },
  { text: "My wife left me because I'm too insecure. No wait, she's back. She just went to get coffee.", author: "Dark" },
  { text: "I asked my North Korean friend how it was there. He said he couldn't complain.", author: "Dark" },
  { text: "What's red and bad for your teeth? A brick.", author: "Dark" },
  { text: "My doctor told me I had only six months to live, so I shot him. The judge gave me twenty years.", author: "Dark" },
  { text: "The doctor gave me some cream for my skin rash. He said I was a sight for psoriasis.", author: "Dark" },
  { text: "What's worse than finding a worm in your apple? The Holocaust.", author: "Dark" },
  { text: "My wife and I were happy for twenty years. Then we met.", author: "Rodney Dangerfield" },
  { text: "I haven't slept for ten days, because that would be too long.", author: "Mitch Hedberg" },
  { text: "I used to do drugs. I still do, but I used to, too.", author: "Mitch Hedberg" },
  { text: "My fake plants died because I did not pretend to water them.", author: "Mitch Hedberg" },
  { text: "I'm against picketing, but I don't know how to show it.", author: "Mitch Hedberg" },
  { text: "I like rice. Rice is great when you're hungry and want 2,000 of something.", author: "Mitch Hedberg" },
  { text: "I bought a seven-dollar pen because I always lose pens and I got sick of not caring.", author: "Mitch Hedberg" },
  { text: "I'm sick of following my dreams. I'm just going to ask them where they're going and hook up with them later.", author: "Mitch Hedberg" },
  { text: "The depressing thing about tennis is that no matter how good I get, I'll never be as good as a wall.", author: "Mitch Hedberg" },
  { text: "I want to die peacefully in my sleep, like my grandfather. Not screaming and yelling like the passengers in his car.", author: "Dark" },
  { text: "Dark humor is like food. Not everyone gets it.", author: "Dark" },
  { text: "Dark humor is like a kid with cancer. It never gets old.", author: "Dark" },
  { text: "My grandpa said I rely too much on technology. I called him a hypocrite and unplugged his life support.", author: "Dark" },
  { text: "Why can't orphans play baseball? They don't know where home is.", author: "Dark" },
  { text: "I was digging in the garden when I found a chest full of gold coins. I was so excited to run in and tell my wife. Then I remembered why I was digging.", author: "Dark" },
  { text: "What do you call a cheap circumcision? A rip off.", author: "Dark" },
  { text: "Why did Mozart kill all his chickens? Because when he asked them who the best composer was, they all said 'Bach Bach Bach.'", author: "Dark" },
  { text: "I started crying when my dad was cutting onions. Onions was such a good dog.", author: "Dark" },
  { text: "What's the difference between a baby and a sweet potato? About 140 calories.", author: "Dark" },
  { text: "I took my grandma to a fish spa where the fish eat your dead skin. It was cheaper than a funeral.", author: "Dark" },
  { text: "Cremation. My final hope for a smoking hot body.", author: "Dark" },
  { text: "My wife is mad at me because I have no sense of direction. So I packed up my stuff and right.", author: "Dark" },
  { text: "I'll never forget my grandfather's last words: 'Stop shaking the ladder you little shit.'", author: "Dark" },
  { text: "What's the last thing to go through a fly's head as it hits the windshield? Its ass.", author: "Dark" },
  { text: "How many emo kids does it take to change a lightbulb? None, they all just sit in the dark and cry.", author: "Dark" },
  { text: "I just read that someone in New York gets stabbed every 52 seconds. Poor guy.", author: "Dark" },
  { text: "When my uncle died, the crematorium donated his body to the chemistry department. That's calcium.", author: "Dark" },
  { text: "My wife's cooking is so bad we pray after we eat.", author: "Rodney Dangerfield" },
  { text: "I looked up my symptoms online. It turns out I just have kids.", author: "Dark" },
  { text: "A priest, a minister, and a rabbit walk into a blood bank. The rabbit says, 'I think I might be a Type O.'", author: "Dark" },
  { text: "My friend asked me to help him round up his 37 sheep. I said '40.'", author: "Dark" },
  { text: "I broke up with my gym. We were just not working out.", author: "Dark" },
  { text: "What's the difference between a Lamborghini and a pile of dead bodies? I don't have a Lamborghini in my garage.", author: "Dark" },
  { text: "Welcome to Plastic Surgery Anonymous. Nice to see so many new faces.", author: "Dark" },
  { text: "I got a new job at a guillotine factory. I'll beheading there soon.", author: "Dark" },
  { text: "What did Kermit the Frog say at Jim Henson's funeral? Nothing.", author: "Dark" },
  { text: "The guy who invented autocorrect has died. His funfair will be held tomato.", author: "Dark" },
  { text: "I hate double standards. Burn a body at a crematorium and you're doing a good job. Burn one at home and you're destroying evidence.", author: "Dark" },
  { text: "Never break someone's heart. They only have one. Break their bones instead. They have 206.", author: "Dark" },
  { text: "I used to think the brain was the most important organ. Then I thought, look what's telling me that.", author: "Emo Philips" },
  { text: "I have a lot of growing up to do. I realized that the other day inside my fort.", author: "Zach Galifianakis" },
  { text: "I failed my driver's test. The instructor asked me 'What do you do at a red light?' I said, 'I usually check my emails and update my Facebook status.'", author: "Dark" },
  { text: "My wife says I have no sense of direction. So I packed my bags and right.", author: "Dark" },
  { text: "Relationships are a lot like algebra. Have you ever looked at your X and wondered Y?", author: "Dark" },
  { text: "A pessimist is just an optimist with experience.", author: "Dark" },
  { text: "Life is hard. After all, it kills you.", author: "Katharine Hepburn" },
  { text: "Always borrow money from a pessimist. They won't expect it back.", author: "Dark" },
];

// Motivational quotes from great business minds
const QUOTES = [
  // Classic Business Leaders
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg" },
  { text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", author: "Mark Zuckerberg" },
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
  { text: "It's fine to celebrate success but it is more important to heed the lessons of failure.", author: "Bill Gates" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "The secret of business is to know something that nobody else knows.", author: "Aristotle Onassis" },
  { text: "Business opportunities are like buses, there's always another one coming.", author: "Richard Branson" },
  { text: "A business that makes nothing but money is a poor business.", author: "Henry Ford" },
  { text: "Chase the vision, not the money; the money will end up following you.", author: "Tony Hsieh" },
  { text: "Winners never quit and quitters never win.", author: "Vince Lombardi" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { text: "Someone is sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "The way I see it, if you want the rainbow, you gotta put up with the rain.", author: "Dolly Parton" },
  { text: "Capital isn't scarce; vision is.", author: "Sam Walton" },
  { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
  { text: "Be undeniably good. No marketing effort or social media buzzword can be a substitute for that.", author: "Anthony Volodkin" },
  { text: "Make every detail perfect and limit the number of details to perfect.", author: "Jack Dorsey" },
  { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
  { text: "The critical ingredient is getting off your butt and doing something.", author: "Nolan Bushnell" },
  { text: "Get big quietly, so you don't tip off potential competitors.", author: "Chris Dixon" },

  // Modern Tech & Finance
  { text: "Work like hell. Put in 80-100 hour weeks. This improves the odds of success.", author: "Elon Musk" },
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" },
  { text: "Persistence is very important. You should not give up unless you are forced to give up.", author: "Elon Musk" },
  { text: "It doesn't matter how many times you fail. You only have to be right once.", author: "Mark Cuban" },
  { text: "Sweat equity is the most valuable equity there is.", author: "Mark Cuban" },
  { text: "Work like there is someone working 24 hours a day to take it all away from you.", author: "Mark Cuban" },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Be fearful when others are greedy and greedy when others are fearful.", author: "Warren Buffett" },
  { text: "Only when the tide goes out do you discover who's been swimming naked.", author: "Warren Buffett" },
  { text: "Time is the friend of the wonderful company, the enemy of the mediocre.", author: "Warren Buffett" },
  { text: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
  { text: "The four most dangerous words in investing are: 'This time it's different.'", author: "Sir John Templeton" },
  { text: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { text: "Behind every stock is a company. Find out what it's doing.", author: "Peter Lynch" },
  { text: "The individual investor should act consistently as an investor and not as a speculator.", author: "Ben Graham" },

  // Hustle & Grind
  { text: "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.", author: "Carmelo Anthony" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Don't be distracted by criticism. Remember, the only taste of success some people get is to take a bite out of you.", author: "Zig Ziglar" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying.", author: "Jeff Bezos" },
  { text: "What's dangerous is not to evolve.", author: "Jeff Bezos" },
  { text: "Your brand is what people say about you when you're not in the room.", author: "Jeff Bezos" },
  { text: "If you double the number of experiments you do per year you're going to double your inventiveness.", author: "Jeff Bezos" },
  { text: "Life is too short to hang out with people who aren't resourceful.", author: "Jeff Bezos" },
  { text: "We are stubborn on vision. We are flexible on details.", author: "Jeff Bezos" },

  // Leadership & Strategy
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "The greatest leader is not necessarily one who does the greatest things, but one who gets people to do the greatest things.", author: "Ronald Reagan" },
  { text: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Culture eats strategy for breakfast.", author: "Peter Drucker" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "Great things in business are never done by one person. They're done by a team of people.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Details matter, it's worth waiting to get it right.", author: "Steve Jobs" },
  { text: "Quality is more important than quantity. One home run is much better than two doubles.", author: "Steve Jobs" },

  // Mindset & Resilience
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Coming together is a beginning. Keeping together is progress. Working together is success.", author: "Henry Ford" },
  { text: "Don't find fault, find a remedy.", author: "Henry Ford" },
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
  { text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.", author: "Charles Darwin" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "People who succeed have momentum. The more they succeed, the more they want to succeed.", author: "Tony Robbins" },

  // Wall Street & Finance Legends
  { text: "The markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.", author: "George Soros" },
  { text: "It's not whether you're right or wrong that's important, but how much money you make when you're right.", author: "George Soros" },
  { text: "I'm only rich because I know when I'm wrong.", author: "George Soros" },
  { text: "The trick is not to learn to trust your gut feelings, but rather to discipline yourself to ignore them.", author: "Peter Lynch" },
  { text: "Go for a business that any idiot can run - because sooner or later, any idiot is probably going to run it.", author: "Peter Lynch" },
  { text: "In this business, if you're good, you're right six times out of ten.", author: "Peter Lynch" },
  { text: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.", author: "Warren Buffett" },
  { text: "Wide diversification is only required when investors do not understand what they are doing.", author: "Warren Buffett" },
  { text: "It takes 20 years to build a reputation and five minutes to ruin it.", author: "Warren Buffett" },
  { text: "The most important quality for an investor is temperament, not intellect.", author: "Warren Buffett" },

  // Entrepreneurship & Startups
  { text: "The way to get startup ideas is not to try to think of startup ideas. It's to look for problems.", author: "Paul Graham" },
  { text: "Make something people want.", author: "Paul Graham" },
  { text: "It's hard to do a really good job on anything you don't think about in the shower.", author: "Paul Graham" },
  { text: "Live in the future, then build what's missing.", author: "Paul Graham" },
  { text: "The most successful founders are those who've been thinking about the problem for years.", author: "Sam Altman" },
  { text: "Move fast. Speed is one of your main advantages over large competitors.", author: "Sam Altman" },
  { text: "Starting a company is like eating glass and staring into the abyss of death.", author: "Elon Musk" },
  { text: "If you're not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman" },
  { text: "An entrepreneur is someone who jumps off a cliff and builds a plane on the way down.", author: "Reid Hoffman" },
  { text: "The fastest way to change yourself is to hang out with people who are already the way you want to be.", author: "Reid Hoffman" },

  // Closing Deals & Sales
  { text: "Every sale has five basic obstacles: no need, no money, no hurry, no desire, no trust.", author: "Zig Ziglar" },
  { text: "Stop selling. Start helping.", author: "Zig Ziglar" },
  { text: "You don't close a sale; you open a relationship if you want to build a long-term, successful enterprise.", author: "Patricia Fripp" },
  { text: "Pretend that every single person you meet has a sign around their neck that says 'Make me feel important.'", author: "Mary Kay Ash" },
  { text: "Sales are contingent upon the attitude of the salesman, not the attitude of the prospect.", author: "W. Clement Stone" },
  { text: "The key to successful leadership today is influence, not authority.", author: "Ken Blanchard" },
  { text: "In sales, a referral is the key to the door of resistance.", author: "Bo Bennett" },
  { text: "Approach each customer with the idea of helping them solve a problem, not selling a product.", author: "Brian Tracy" },

  // Wealth Building
  { text: "Formal education will make you a living; self-education will make you a fortune.", author: "Jim Rohn" },
  { text: "Don't let making a living prevent you from making a life.", author: "John Wooden" },
  { text: "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs.", author: "Zig Ziglar" },
  { text: "The goal isn't more money. The goal is living life on your terms.", author: "Chris Brogan" },
  { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "Annual income twenty pounds, annual expenditure nineteen pounds, result happiness.", author: "Charles Dickens" },
  { text: "Not everything that can be counted counts, and not everything that counts can be counted.", author: "Albert Einstein" },

  // Taking Action
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.", author: "Mark Twain" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "If you want something you've never had, you must be willing to do something you've never done.", author: "Thomas Jefferson" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
];

interface User {
  id: number;
  name: string;
  email: string;
  backendUserId: number | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndTime: number | null;
  verifyPin: (pin: string) => { success: boolean; user?: User; error?: string };
  logout: () => void;
  quote: { text: string; author: string } | null;
  dismissQuote: () => void;
  showingQuote: boolean;
  alternativeMode: boolean;
  toggleAlternativeMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function simpleHash(pin: string): string {
  return `a${pin}z`;
}

const ALT_MODE_KEY = "arrow_alt_mode";

// Resolve backend user ID by matching email against the API
async function resolveBackendUserId(email: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`);
    if (!res.ok) return null;
    const users = await res.json();
    const match = users.find((u: { email: string }) => u.email === email);
    return match?.id ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [showingQuote, setShowingQuote] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [alternativeMode, setAlternativeMode] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedLockout = localStorage.getItem(LOCKOUT_KEY);
    const storedAltMode = localStorage.getItem(ALT_MODE_KEY);

    if (storedAltMode === "true") {
      setAlternativeMode(true);
    }

    if (storedLockout) {
      const lockoutData = JSON.parse(storedLockout);
      const now = Date.now();

      if (lockoutData.endTime > now) {
        setIsLocked(true);
        setLockoutEndTime(lockoutData.endTime);
        setAttemptsRemaining(0);
      } else {
        // Lockout expired
        localStorage.removeItem(LOCKOUT_KEY);
        setAttemptsRemaining(MAX_ATTEMPTS);
      }
    }

    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      // Session valid for 24 hours
      if (sessionData.expiry > Date.now()) {
        const foundUser = USERS.find(u => u.id === sessionData.userId);
        if (foundUser) {
          const userData: User = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            backendUserId: sessionData.backendUserId ?? null,
          };
          setUser(userData);

          // If we don't have a cached backendUserId, resolve it
          if (!sessionData.backendUserId) {
            resolveBackendUserId(foundUser.email).then((backendId) => {
              if (backendId) {
                setUser((prev) => prev ? { ...prev, backendUserId: backendId } : prev);
                // Cache it in session for future restores
                localStorage.setItem(SESSION_KEY, JSON.stringify({
                  ...sessionData,
                  backendUserId: backendId,
                }));
              }
            });
          }
        }
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    setIsInitialized(true);
  }, []);

  // Check lockout timer
  useEffect(() => {
    if (!lockoutEndTime) return;

    const interval = setInterval(() => {
      if (Date.now() >= lockoutEndTime) {
        setIsLocked(false);
        setLockoutEndTime(null);
        setAttemptsRemaining(MAX_ATTEMPTS);
        localStorage.removeItem(LOCKOUT_KEY);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const verifyPin = useCallback((pin: string): { success: boolean; user?: User; error?: string } => {
    if (isLocked) {
      return { success: false, error: "Account locked. Please try again later." };
    }

    if (pin.length !== 6) {
      return { success: false, error: "PIN must be 6 digits" };
    }

    const hash = simpleHash(pin);
    const foundUser = USERS.find(u => u.pinHash === hash);

    if (foundUser) {
      const userData: User = { id: foundUser.id, name: foundUser.name, email: foundUser.email, backendUserId: null };
      setUser(userData);
      setAttemptsRemaining(MAX_ATTEMPTS);

      // Set initial session (will be updated with backendUserId when resolved)
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: foundUser.id,
        expiry,
      }));

      // Resolve backend user ID and update session
      resolveBackendUserId(foundUser.email).then((backendId) => {
        if (backendId) {
          setUser((prev) => prev ? { ...prev, backendUserId: backendId } : prev);
          // Update session with backend ID
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            userId: foundUser.id,
            expiry,
            backendUserId: backendId,
          }));
        }
      });

      // Show random quote or joke based on mode
      const storedAltMode = localStorage.getItem(ALT_MODE_KEY) === "true";
      const source = storedAltMode ? JOKES : QUOTES;
      const randomQuote = source[Math.floor(Math.random() * source.length)];
      setQuote(randomQuote);
      setShowingQuote(true);

      return { success: true, user: userData };
    } else {
      const newAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(newAttempts);

      if (newAttempts <= 0) {
        const endTime = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutEndTime(endTime);
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ endTime }));
        return { success: false, error: "Too many failed attempts. Account locked for 30 minutes." };
      }

      return { success: false, error: `Invalid code. ${newAttempts} attempts remaining.` };
    }
  }, [isLocked, attemptsRemaining]);

  const logout = useCallback(() => {
    setUser(null);
    setQuote(null);
    setShowingQuote(false);
    localStorage.removeItem(SESSION_KEY);
    // Clear all persisted table filter keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("arrow_filters_") || key.startsWith("arrow_view_"))) {
        localStorage.removeItem(key);
      }
    }
  }, []);

  const dismissQuote = useCallback(() => {
    setShowingQuote(false);
  }, []);

  const toggleAlternativeMode = useCallback(() => {
    setAlternativeMode(prev => {
      const newValue = !prev;
      localStorage.setItem(ALT_MODE_KEY, String(newValue));
      // Immediately swap the quote/joke
      const source = newValue ? JOKES : QUOTES;
      const randomQuote = source[Math.floor(Math.random() * source.length)];
      setQuote(randomQuote);
      return newValue;
    });
  }, []);

  if (!isInitialized) {
    return null; // Prevent flash
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLocked,
        attemptsRemaining,
        lockoutEndTime,
        verifyPin,
        logout,
        quote,
        dismissQuote,
        showingQuote,
        alternativeMode,
        toggleAlternativeMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
