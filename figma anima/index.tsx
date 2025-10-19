import React from "react";
import divider from "./divider.svg";
import image5 from "./image-5.png";
import image from "./image.png";
import map from "./map.png";
import socialIcons from "./social-icons.svg";
import solarRay1 from "./solar-ray-1.svg";
import solarRay2 from "./solar-ray-2.svg";
import solarRay3 from "./solar-ray-3.svg";
import solarizeLogo from "./solarize-logo.png";
import solarizeMiniLogo1 from "./solarize-mini-logo-1.png";

const howItWorksSteps = [
  {
    id: 1,
    title: "Collects Data",
    description: "Pulls solar, terrain, and infrastructure data.",
    imageClass: "bg-[url(/image-2.png)]",
  },
  {
    id: 2,
    title: "Optimizes",
    description: "Weighs each factor using a real-time scoring model.",
    imageClass: "bg-[url(/image-3.png)]",
  },
  {
    id: 3,
    title: "Visualizes",
    description: "Displays interactive maps and top site recommendations",
    imageClass: "bg-[url(/image-4.png)]",
  },
];

export const LandingPage = (): JSX.Element => {
  return (
    <div className="bg-[#f6fff4] overflow-hidden w-full min-w-[1440px] min-h-[3354px] relative">
      <header className="absolute w-full top-0 left-0 h-[164px] flex justify-between">
        <img
          className="mt-[47px] w-[172px] h-[69px] ml-20 aspect-[2.5] object-cover"
          alt="Solarize logo"
          src={solarizeLogo}
        />

        <nav className="inline-flex mt-14 w-[82px] h-[52px] relative mr-20 items-center justify-end gap-[var(--variable-collection-spacing-m)]">
          <button className="all-[unset] box-border inline-flex items-center justify-center gap-2 px-6 py-3.5 relative flex-[0_0_auto] bg-[#6d4c3d] rounded-lg shadow-button-shadow">
            <span className="relative flex items-center justify-center w-fit mt-[-1.00px] font-small-text font-[number:var(--small-text-font-weight)] text-white text-[length:var(--small-text-font-size)] tracking-[var(--small-text-letter-spacing)] leading-[var(--small-text-line-height)] whitespace-nowrap [font-style:var(--small-text-font-style)]">
              Map
            </span>
          </button>
        </nav>
      </header>

      <footer className="absolute w-full left-0 bottom-0 h-[264px] bg-[#ffffff45]">
        <p className="absolute top-[190px] left-[1169px] w-[216px] h-6 flex items-center justify-center font-small-text font-[number:var(--small-text-font-weight)] text-[#444444] text-[length:var(--small-text-font-size)] tracking-[var(--small-text-letter-spacing)] leading-[var(--small-text-line-height)] [font-style:var(--small-text-font-style)]">
          Made By Iris, Liam &amp; Alec
        </p>

        <img
          className="absolute top-44 left-20 w-[184px] h-10"
          alt="Social icons"
          src={socialIcons}
        />

        <img
          className="absolute top-0 left-20 w-[1280px] h-px object-cover"
          alt="Divider"
          src={divider}
        />

        <img
          className="absolute top-[47px] left-20 w-[172px] h-[69px] aspect-[2.5] object-cover"
          alt="Solarize logo"
          src={image}
        />

        <p className="absolute top-[117px] left-20 w-[844px] h-9 flex items-center justify-center font-subheading font-[number:var(--subheading-font-weight)] text-[#000000bf] text-[length:var(--subheading-font-size)] tracking-[var(--subheading-letter-spacing)] leading-[var(--subheading-line-height)] [font-style:var(--subheading-font-style)]">
          Join Us in Building a Brighter World
        </p>
      </footer>

      <section className="absolute top-[1994px] left-[calc(50.00%_-_646px)] w-[1283px] h-[666px] flex flex-col">
        <h2 className="ml-[-659px] h-[58px] w-[624px] self-center [font-family:'Inter-SemiBold',Helvetica] font-semibold text-black text-5xl tracking-[-0.96px] leading-[normal]">
          How It Works
        </h2>

        <p className="w-[122px] h-9 mt-[19px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#828282] text-2xl tracking-[0] leading-9 whitespace-nowrap">
          Solarize....
        </p>

        <div className="flex w-[1279px] h-[541px] relative mt-3 items-center gap-8">
          {howItWorksSteps.map((step) => (
            <article
              key={step.id}
              className="flex flex-col items-start gap-6 relative flex-1 grow"
            >
              <div
                className={`relative self-stretch w-full h-[405px] rounded-lg ${step.imageClass} bg-cover bg-[50%_50%]`}
              />

              <div className="flex flex-col w-[381px] items-start justify-center gap-1 relative flex-[0_0_auto]">
                <h3 className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-black text-2xl tracking-[0] leading-9">
                  {step.title}
                </h3>

                <p className="relative flex items-center justify-center self-stretch [font-family:'Inter-Regular',Helvetica] font-normal text-[#828282] text-2xl tracking-[0] leading-9">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="absolute top-[1260px] left-[51px] w-[1619px] h-[606px]">
        <div className="absolute top-[27px] left-[45px] w-[627px] h-[541px] flex flex-col gap-[23px]">
          <h2 className="w-[625px] h-[58px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-black text-5xl text-right tracking-[-0.96px] leading-[normal]">
            REBRANDING ENERGY
          </h2>

          <div className="h-[460px] items-end gap-[42px] flex w-[625px] relative flex-col">
            <div className="items-start justify-center gap-2 flex-[0_0_auto] flex w-[625px] relative flex-col">
              <p className="relative flex items-center justify-center self-stretch mt-[-1.00px] font-subheading font-[number:var(--subheading-font-weight)] text-[#000000bf] text-[length:var(--subheading-font-size)] text-right tracking-[var(--subheading-letter-spacing)] leading-[var(--subheading-line-height)] [font-style:var(--subheading-font-style)]">
                Automating land surveys for optimal solar
                <br />
                panel locations using open-source data from
                <br />
                NASA, NREL, and OpenStreetMap (OSM).
              </p>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <h3 className="relative w-[515px] mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-black text-2xl tracking-[0] leading-9">
                What Solarize Does:
              </h3>

              <p className="relative flex items-center justify-center w-[515px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#828282] text-2xl tracking-[0] leading-9">
                Solarize analyzes solar irradiance and terrain to provide areas
                with highest energy output.
              </p>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <h3 className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-black text-2xl tracking-[0] leading-9">
                Goals
              </h3>

              <p className="relative flex items-center justify-center self-stretch [font-family:'Inter-Regular',Helvetica] font-normal text-[#828282] text-2xl tracking-[0] leading-9">
                Maximize energy output
                <br />
                Reduce costs and risks
                <br />
                Increase accessibility to sustainable living
              </p>
            </div>
          </div>
        </div>

        <img
          className="absolute top-[42px] left-0 w-[153px] h-[153px] aspect-[1] object-cover"
          alt="Solarize mini logo"
          src={solarizeMiniLogo1}
        />

        <img
          className="absolute top-0 left-[709px] w-[680px] h-[606px] aspect-[1.5] object-cover"
          alt="Image"
          src={image5}
        />
      </section>

      <section className="absolute top-[2800px] -left-px w-[1440px] h-[236px] bg-[#e5f1e5]">
        <button className="all-[unset] box-border absolute top-20 left-[1155px] inline-flex items-center gap-2 px-8 py-5 bg-[#6d4c3d] rounded-lg shadow-button-shadow">
          <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-white text-2xl tracking-[0] leading-9 whitespace-nowrap">
            Launch Map
          </span>
        </button>

        <h2 className="absolute top-[89px] left-[calc(50.00%_-_640px)] w-[625px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-black text-5xl tracking-[-0.96px] leading-[normal]">
          Check Out Solarize
        </h2>
      </section>

      <section className="flex flex-col w-[844px] items-start gap-10 absolute top-[212px] left-[79px]">
        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Inter-Bold',Helvetica] font-bold text-black text-[64px] tracking-[-1.28px] leading-[normal]">
            Welcome to Solarize
          </h1>

          <p className="relative flex items-center justify-center self-stretch font-subheading font-[number:var(--subheading-font-weight)] text-[#000000bf] text-[length:var(--subheading-font-size)] tracking-[var(--subheading-letter-spacing)] leading-[var(--subheading-line-height)] [font-style:var(--subheading-font-style)]">
            Find the brightest spots for solar panels.
          </p>

          <img
            className="relative w-[1288px] h-[650px] mb-[-8.00px] ml-[-4.00px] mr-[-440.00px] aspect-[1.99]"
            alt="Map"
            src={map}
          />
        </div>

        <button className="all-[unset] box-border relative flex-[0_0_auto] inline-flex items-center gap-2 px-8 py-5 bg-[#6d4c3d] rounded-lg shadow-button-shadow">
          <span className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-white text-2xl tracking-[0] leading-9 whitespace-nowrap">
            Head to Map
          </span>
        </button>
      </section>

      <img
        className="left-[1003px] w-[388px] h-[339px] absolute top-0"
        alt="Solar ray"
        src={solarRay2}
      />

      <img
        className="left-[639px] w-[729px] h-[716px] absolute top-0"
        alt="Solar ray"
        src={solarRay1}
      />

      <img
        className="left-[391px] w-[175px] h-[198px] absolute top-0"
        alt="Solar ray"
        src={solarRay3}
      />
    </div>
  );
};