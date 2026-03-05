"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildFreshSession, DEFAULT_WORDS, loadJSON, makeResults, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { SessionResults } from "@/lib/types";
import { chooseBestUSVoice } from "@/lib/tts";

const DAD_JOKES = [
  "What did the policeman say to his tummy? You're under a vest!",
  "Knock knock. Who's there? Boo. Boo who? No need to cry.",
  "Knock knock. Who's there? Europe. Europe who? No, you're a poo!",
  "Knock knock. Who's there? Smell Mop. Smell Mop who? Ugh! No thank you!",
  "Why did the baker have brown hands? Because he kneaded a poo!",
  "Why did the banana go to the doctor? Because he wasn't peeling very well.",
  "What do you call Postman Pat without a job? Pat!",
  "What do you get if you cross a dinosaur with a pig? Jurassic Pork!",
  "What time do you go to the dentist? Tooth hurty.",
  "Knock knock. Who's there? Atish. Atish who? Bless you!",
  "What kind of room doesn't have windows or a door? A mushroom.",
  "What do you get when you mix a cow with an earthquake? A milkshake.",
  "What do you call a donkey with three legs? A wonkey!",
  "What do you call two robbers? A pair of knickers!",
  "I'd tell you the joke about the jam, but you would spread it.",
  "What do lions eat? Roar meat!",
  "Why can't you trust stairs? Because they're always up to something!",
  "Two snowmen are in a field. One says to the other, can you smell carrots?",
  "What happens when two giraffes collide? A giraffic jam.",
  "What do you call brown peas? Poop peas!",
  "Two fish are in a tank. One says to the other, do you know how to drive this thing?",
  "Knock knock. Who's there? Who. Who who? I didn't know you were an owl.",
  "Why can't you give Elsa a balloon? Because she might let it go!",
  "My feet smell and my nose runs. I think I've been made upside down!",
  "Why was 6 afraid of 7? Because 7, 8 (ate) 9!",
  "What do you call mozzarella that doesn't belong to you? Nacho cheese!",
  "What bees produce milk? Boo-bees!",
  "Why do you put bulbs in the ground? So the worms can see.",
  "What's brown and sticky? A stick!",
  "Knock knock. Who's there? Nunya. Nunya who? Nunya business.",
  "What do you call a fish without an eye? A fsh!",
  "Why are pirates called pirates? Because they arrrrr!",
  "What do you call a camel with no humps? Humphrey.",
  "What did one eye say to the other eye? Between you and me, something smells.",
  "What happened to the ice cream van? It melted.",
  "Why did Tigger stick his head in the toilet? Because he was looking for Pooh!",
  "What do you call a bear with no ears? B.",
  "What cheese do you use to hide a horse? Maskapony!",
  "What do you call a gorilla with no ears? Anything you like, he can't hear you.",
  "Which monster lives on your finger? The bogeyman.",
  "Why did the beach blush? Because the sea weed.",
  "Knock knock. Who's there? I done up. I done up who? Ha ha ha, you've done a poo!",
  "Where do cows go on a Friday night? The moooooovies!",
  "Why wouldn't the shrimp share his treasure? Because he was a little shellfish.",
  "Why do giraffes have long necks? Because their feet smell.",
  "Knock knock. Who's there? Interrupting cat. Interrupting c- Meow!",
  "Why can't the music teacher start his car? His keys are on the piano.",
  "Why did the tomato blush? Because he saw the salad dressing.",
  "How do you throw a space party? You planet.",
  "What time do the ducks wake up? At the quack of dawn.",
  "What type of bug is in the FBI? A spy-der.",
  "Where do fish keep their money? In the riverbank.",
  "What do we want? Race car noises! When do we want them? Neeeeeoooow!",
  "Why do bananas have to put on sunscreen before they go to the beach? Because they might peel!",
  "Why do we never tell jokes about pizza? They're too cheesy!",
  "What's blue and smells like red paint? Blue paint.",
  "Why did the dinosaur cross the road? Because the chicken didn't exist yet!",
  "Why did the golfer wear two pairs of pants? In case he got a hole in one!",
  "Knock knock. Who's there? Ma Damn. Ma Damn who? Ma damn foot is caught in the door, let me in!",
  "I love my furniture. Me and my recliner go way back.",
  "Two sausages are in a pan. One says, it's a bit hot in here! The other says, AAHH! A talking sausage!",
  "Two biscuits are crossing the road and one gets run over. What did the other one say? Oh crumbs!",
  "What cheese do you use to encourage Winnie the Pooh? Camembert.",
  "What did the cheese say to the microwave? Halloumi!",
  "Why did the cheesemonger buy insulation? Because of the bries!",
  "Why are teddy bears never hungry? Because they are always stuffed.",
  "What did 8 say to 0? I like your belt!",
  "What do you call a dinosaur with one eye? Dyafinkeesaurus!",
  "What did Sherlock Holmes do when he dropped his phone? He cracked the case wide open!",
  "Why did the man throw water out of the window? He wanted to see the waterfall.",
  "Why is it always cold in a football stadium? Because of all the fans!",
  "What is orange and sounds like a parrot? A carrot.",
  "Why don't seagulls fly over bays? Because otherwise they would be bagels.",
  "Why did the children eat their homework? Because their teacher told them it was a piece of cake!",
  "Why do mushrooms like to party so much? Because they're a fungi!",
  "What's a crocodile's favorite game? Snap!",
  "How do you make a sausage roll? Push it down a hill.",
  "Have I ever told you my bin joke? Nah, it's rubbish.",
  "Why do birds fly south for the winter? Because it's too far to walk.",
  "Knock knock. Who's there? Imap. Imap who? I'm a poo!",
  "Why don't ants catch flu? Because they have tiny anti-bodies."
];

function speakCelebration(joke: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  const voice = chooseBestUSVoice(voices);

  window.speechSynthesis.cancel();

  const intro = new SpeechSynthesisUtterance("You did awesome! You win a dad joke!");
  intro.lang = "en-US";
  intro.rate = 0.92;
  intro.pitch = 1;
  if (voice) intro.voice = voice;

  const jokeUtterance = new SpeechSynthesisUtterance(joke);
  jokeUtterance.lang = "en-US";
  jokeUtterance.rate = 0.92;
  jokeUtterance.pitch = 1;
  if (voice) jokeUtterance.voice = voice;

  intro.onend = () => {
    window.speechSynthesis.speak(jokeUtterance);
  };

  window.speechSynthesis.speak(intro);
}

export default function PerfectResultsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selectedJoke, setSelectedJoke] = useState("");
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    const stored = loadJSON<SessionResults>(STORAGE_KEYS.results);
    if (!stored) {
      router.replace("/");
      return;
    }

    if (stored.accuracy < 1) {
      router.replace("/results");
      return;
    }

    const joke = DAD_JOKES[Math.floor(Math.random() * DAD_JOKES.length)] ?? "You're awesome!";
    setSelectedJoke(joke);
    setReady(true);

    const runSpeech = () => {
      if (hasSpokenRef.current) return;
      hasSpokenRef.current = true;
      speakCelebration(joke);
    };

    runSpeech();

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [router]);

  const practiceAgain = () => {
    const words = loadJSON<string[]>(STORAGE_KEYS.words) ?? DEFAULT_WORDS;
    const fresh = buildFreshSession(words, false);
    saveJSON(STORAGE_KEYS.session, fresh);
    saveJSON(STORAGE_KEYS.results, makeResults(fresh));
    router.push("/practice");
  };

  if (!ready) return <main className="page"><p className="card">Loading…</p></main>;

  return (
    <main className="page">
      <section className="card perfectCard" aria-label="Perfect score celebration">
        <div className="fireworks" aria-hidden="true">
          <span className="burst b1" />
          <span className="burst b2" />
          <span className="burst b3" />
          <span className="burst b4" />
          <span className="burst b5" />
        </div>

        <h1>🎉 PERFECT SCORE! 🎉</h1>
        <p className="big">You crushed it. 100% accuracy!</p>
        <p className="big">Amazing spelling work — seriously awesome.</p>
        <p className="big perfectJoke">🏆 Dad joke prize: {selectedJoke}</p>

        <div className="controls perfectControls">
          <button className="btn" onClick={practiceAgain} aria-label="Practice again with same list">Practice Again</button>
          <button className="btn" onClick={() => router.push("/")} aria-label="Go to title page and practice other words">Practice other words</button>
        </div>
      </section>
    </main>
  );
}
