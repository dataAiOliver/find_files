from common.config import *

from langchain_ollama.llms import OllamaLLM
import json


def execute_text_prompt(llm, prompt, is_json_response=None):
    logger.info(f"Prompt Original:\n\n{prompt}")
    r = llm.invoke(prompt)
    logger.info(f"RESPONSE_ORIG:\n\n'{r}'")
    try:
        response_short = r.content
        logger.info(f"HAS CONTENT")
    except:
        response_short = r
        logger.info(f"HAS NO CONTENT")
    if is_json_response:
        logger.info(f"Format JSON")
        """
        I had some problems where there was an additional double quote at the end, like
        '{"categories" : ["Mietvertrag", "Lagerraum"]}"'
        Therefore use this solution where we look for the brackets.
        """
        i1 = response_short.rfind("{")
        i2 = response_short.rfind("}")
        response_short = response_short[i1 : i2 + 1]
        if response_short.startswith("```"):
            logger.info(f"Remove additional text")
            response_short = "\n".join(response_short.splitlines()[1:-1])
        if not isinstance(response_short, dict):
            logger.info(f"No dict, it is {type(response_short)}")
            try:
                response_short = json.loads(response_short)
            except:
                logger.info(
                    f"Couldnt transform to json, try complex method:\n\n{response_short}"
                )
                response_short = json.loads(response_short, strict=False)

        if "response" in response_short:
            logger.info(f"Response is a key")
            response_short = response_short["response"]
        if isinstance(response_short, str):
            logger.info(f"Its a string, transform to dict.")
            response_short = json.loads(response_short)

    return response_short


def response2json(r_orig):
    i1 = r_orig.find("{")
    i2 = r_orig.rfind("}") + 1
    r_json = r_orig[i1:i2]
    try:
        return json.loads(r_json)
    except:
        return None
