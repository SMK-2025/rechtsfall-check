type AiIntake={facts:string[];missingQuestions:string[];contradictions:string[];plainLanguageSummary:string};
const schema={type:"object",additionalProperties:false,properties:{
  facts:{type:"array",items:{type:"string"}},
  missingQuestions:{type:"array",items:{type:"string"}},
  contradictions:{type:"array",items:{type:"string"}},
  plainLanguageSummary:{type:"string"},
},required:["facts","missingQuestions","contradictions","plainLanguageSummary"]};
export async function analyzeIntake(input:{topic?:string;eventDate?:string;description?:string},safetyIdentifier:string):Promise<AiIntake|null>{
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return null;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({
    model:process.env.OPENAI_MODEL||"gpt-5.6-terra",reasoning:{effort:"medium"},store:false,safety_identifier:safetyIdentifier,
    instructions:"Du strukturierst die Fallaufnahme einer deutschen Legal-Tech-Plattform. Extrahiere ausschließlich Angaben aus dem Nutzereingang. Erfinde keine Tatsachen, Rechtsquellen, Fristen, Ansprüche oder Empfehlungen. Formuliere neutral und verständlich. Keine abschließende Rechtsberatung, keine verbindliche Handlungsanweisung und keine finale Einzelfallentscheidung.",
    input:`Thema: ${input.topic||"nicht angegeben"}\nEreignisdatum: ${input.eventDate||"nicht angegeben"}\nSchilderung: ${input.description||"nicht angegeben"}`,
    text:{format:{type:"json_schema",name:"legal_intake",strict:true,schema}},
  })});
  if(!response.ok)throw new Error(`OpenAI response failed: ${response.status}`);
  const data=await response.json() as{output?:Array<{content?:Array<{type?:string;text?:string}>}>};
  const text=data.output?.flatMap(item=>item.content||[]).find(item=>item.type==="output_text")?.text;
  if(!text)return null;return JSON.parse(text) as AiIntake;
}
