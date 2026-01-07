import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="bg-white dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-10 md:py-12">
        <div
          className="min-h-[420px] md:min-h-[500px] rounded-2xl bg-cover bg-center flex flex-col items-center justify-center text-center px-4 sm:px-6 gap-6 md:gap-8"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.75)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCinhOaYaNToiAeRGbf2s1X2JkdTXPHVlitO_2wR3JXOMOAo8vGd-1o8q-DG65tMN-hI2roqZzoxgX6DelwM-2c1DGizE4eYhcGKwRt3RNOfJcz9GTSpqX_6pZI9c2kLv0r_dJ5FhaS-8l091X7LxB9V-f30Bhu7uPLIvkZWhUguMYzbg_2746Ex3cyngZhdnZMDtkhV_f5l8uCvAU5JhwyEPjdDTnPDtIhvvI_mnahNs_biOVCC_sz_wBqLC1WiTzixYATDlkwtWNr")',
          }}
        >
          {/* Headline */}
          <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-black leading-tight">
            Find your dream job today
          </h1>

          {/* Subheading */}
          <p className="text-gray-200 text-base sm:text-lg max-w-xl md:max-w-2xl">
            Connecting thousands of professionals with the best companies.
          </p>

          {/* Search Box */}
          <div className="w-full max-w-4xl bg-white dark:bg-card rounded-xl shadow-lg p-3 flex flex-col md:flex-row gap-3 md:gap-2 items-stretch md:items-center">
            <Input
              className="h-12 border-0 shadow-none bg-transparent focus-visible:ring-[1px]"
              placeholder="Job title, keywords, or company"
            />

            <div className="hidden md:block w-[1px] h-8 bg-gray-300 dark:bg-gray-500" />

            <Input
              className="h-12 border-0 shadow-none bg-transparent focus-visible:ring-[1px]"
              placeholder="City, state, or zip code"
            />

            <Button className="h-12 w-full md:w-auto px-8" size="lg">
              Search Jobs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
