interface ProjectDownloadProps {
  repo: string;
}

export default function ProjectDownload({ repo }: ProjectDownloadProps) {
  return (
    <div className="project-download">
      <p>
        This exercise runs better on your own machine. Clone the starter
        project and run it locally with your own API key:
      </p>
      <a href={repo} target="_blank" rel="noreferrer">
        {repo}
      </a>
    </div>
  );
}
