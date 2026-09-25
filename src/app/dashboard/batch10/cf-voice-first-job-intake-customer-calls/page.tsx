'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function VoiceIntakePage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("Voice-first job intake").slice(1,-1)}
      description={JSON.stringify("Capture a call transcript and book a job. Transcription is supplied by the caller.").slice(1,-1)}
      endpoint={JSON.stringify("/api/ai/voice-intake").slice(1,-1)}
      method={"POST"}
      fields={[{"name":"transcript","label":"Call transcript","required":true},{"name":"customerName","label":"Customer name"},{"name":"phone","label":"Phone"}]}
      assumptions={["Transcript text is supplied by the caller (e.g. from a telephony provider); this does not perform speech recognition.","Extracted booking details are returned for review before anything is scheduled."]}
    />
  );
}
