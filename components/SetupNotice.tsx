export function SetupNotice({ message }: { message: string }) {
  return (
    <div className="panel border-cassette-rust/50 p-6">
      <span className="label-tape">Setup needed</span>
      <p className="mt-3 whitespace-pre-line font-mono text-sm text-cassette-creamdim">{message}</p>
    </div>
  );
}
