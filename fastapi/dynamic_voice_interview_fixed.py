import argparse
import json
import os
import time
from glob import glob

import pyttsx3
import speech_recognition as sr
from dotenv import load_dotenv
from groq import Groq


parser = argparse.ArgumentParser(description="Run a Voice-based AI Interview")
parser.add_argument("--candidate", required=True, help="Candidate name (matches extracted_texts file prefix)")
parser.add_argument("--role", default="Software Engineer", help="Job role / position")
args = parser.parse_args()

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")
groq_client = Groq(api_key=GROQ_API_KEY)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def resolve_questions_file(candidate: str) -> str:
    direct = os.path.join(BASE_DIR, "extracted_texts", f"{candidate}_questions.json")
    if os.path.exists(direct):
        return direct

    normalized = candidate.replace(" ", "_")
    normalized_file = os.path.join(BASE_DIR, "extracted_texts", f"{normalized}_questions.json")
    if os.path.exists(normalized_file):
        return normalized_file

    all_files = glob(os.path.join(BASE_DIR, "extracted_texts", "*_questions.json"))
    if not all_files:
        raise FileNotFoundError("No *_questions.json files found in extracted_texts")

    needle = normalized.lower()
    matched = [f for f in all_files if needle in os.path.basename(f).lower()]
    if matched:
        return sorted(matched)[-1]

    # last fallback: latest generated questions file
    return max(all_files, key=os.path.getmtime)


QUESTIONS_FILE = resolve_questions_file(args.candidate)

with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
    questions_data = json.load(f)

# Supports both:
# {"questions": ["Q1", ...]}
# {"questions": {"questions": ["Q1", ...]}}
if isinstance(questions_data.get("questions"), dict):
    QUESTIONS_LIST = questions_data.get("questions", {}).get("questions", [])
else:
    QUESTIONS_LIST = questions_data.get("questions", [])

if not QUESTIONS_LIST:
    raise ValueError(f"No questions found in {QUESTIONS_FILE}")

print(f"[VOICE] Using questions file: {QUESTIONS_FILE}")


def speak(text: str) -> None:
    engine = pyttsx3.init()
    engine.setProperty("rate", 150)
    engine.say(text)
    engine.runAndWait()
    time.sleep(0.3)


def get_followup_question(prev_question: str, user_answer: str, candidate_name: str, role: str) -> str | None:
    prompt = f"""
You are an expert technical interviewer conducting an interview for the role of {role}.
The candidate's name is {candidate_name}.
They just answered the following question.

Question: {prev_question}
{candidate_name}'s Answer: {user_answer}

Generate ONE concise, relevant follow-up question to probe deeper into their technical skills or problem-solving ability based on their answer.
Return ONLY the question text. Do not include any conversational filler.
"""
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
        )
        return (chat_completion.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"Follow-up generation failed: {e}")
        return None


def run_interview() -> None:
    recognizer = sr.Recognizer()
    context: list[dict[str, str]] = []

    greeting = f"Hello {args.candidate}, welcome to your interview for the {args.role} position. We will begin shortly."
    print(greeting)
    speak(greeting)

    with sr.Microphone() as source:
        print("Calibrating microphone for ambient noise...")
        recognizer.adjust_for_ambient_noise(source, duration=2)
        print("Calibration done. You may start answering questions.")

    question_index = 0
    while question_index < len(QUESTIONS_LIST):
        current_question = QUESTIONS_LIST[question_index]

        print(f"\nQuestion: {current_question}")
        speak(f"Next question: {current_question}")

        with sr.Microphone() as source:
            print("Please answer now...")
            try:
                audio = recognizer.listen(source, timeout=25)
                user_answer = recognizer.recognize_google(audio)
                print(f"{args.candidate}'s Answer: {user_answer}")
            except (sr.UnknownValueError, sr.WaitTimeoutError):
                user_answer = "I don't know"
                print("Could not understand / skipped")
                speak("I could not understand your answer or you said you don't know.")

        context.append({"question": current_question, "answer": user_answer, "type": "main"})

        if user_answer.lower() not in ["i don't know", "dont know", "don't know"]:
            followup = get_followup_question(current_question, user_answer, args.candidate, args.role)
            if followup:
                print(f"Follow-up: {followup}")
                speak(followup)

                with sr.Microphone() as source:
                    print("Please answer follow-up...")
                    try:
                        audio = recognizer.listen(source, timeout=20)
                        followup_answer = recognizer.recognize_google(audio)
                        print(f"Follow-up Answer: {followup_answer}")
                    except (sr.UnknownValueError, sr.WaitTimeoutError):
                        followup_answer = "I don't know"
                        print("Follow-up could not be understood")
                        speak("I could not understand your answer or you said you don't know.")

                context.append({"question": followup, "answer": followup_answer, "type": "follow-up"})

        question_index += 1

    safe_name = "".join(c for c in args.candidate if c.isalnum() or c in (" ", "_")).replace(" ", "_")
    output_file = os.path.join(BASE_DIR, f"interview_context_{safe_name}.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(context, f, indent=2)

    closing = f"The interview has finished. Thank you for your time, {args.candidate}."
    speak(closing)
    print(f"Interview finished. All answers saved to {output_file}")


if __name__ == "__main__":
    run_interview()
