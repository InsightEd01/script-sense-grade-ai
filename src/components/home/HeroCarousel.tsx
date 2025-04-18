
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
} from "@/components/ui/carousel";

const images = [
  "/lovable-uploads/3f250b3b-d11c-4b15-a724-5510cc7cd23e.png",
  "/lovable-uploads/d813018d-094a-42d6-9f36-96389b6380c3.png",
  "/lovable-uploads/18aca446-b269-4f36-96c0-3a6d216cd500.png",
  "/lovable-uploads/0a77025e-83e4-410a-bf92-50a6af589c38.png"
];

export const HeroCarousel = () => {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full max-w-4xl mx-auto"
    >
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={index} className="md:basis-full">
            <div className="p-1">
              <div className="overflow-hidden rounded-lg">
                <img
                  src={src}
                  alt={`Education Slide ${index + 1}`}
                  className="w-full h-[400px] object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="hidden md:block">
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </div>
    </Carousel>
  );
};
